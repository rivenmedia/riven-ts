import { logger } from "@repo/core-util-logger";

import type { PackageJson } from "type-fest";

import { RivenPlugin, isRivenPluginPackage } from "../index.ts";

export interface ParsedPlugins {
  validPlugins: RivenPlugin[];
  invalidPlugins: string[];
  unresolvablePlugins: string[];
}

export const parsePluginsFromDependencies = async (
  dependencies: PackageJson.Dependency,
  importResolver: ImportMeta["resolve"],
) => {
  const pluginNames = Object.keys(dependencies).filter((pluginName) =>
    pluginName.startsWith("@repo/plugin-"),
  );

  return pluginNames.reduce<Promise<ParsedPlugins>>(
    async (acc, pluginName) => {
      const parsedPlugins = await acc;

      try {
        const plugin = (await import(importResolver(pluginName))) as unknown;

        if (!isRivenPluginPackage(plugin)) {
          return {
            ...parsedPlugins,
            invalidPlugins: parsedPlugins.invalidPlugins.concat(pluginName),
          };
        }

        return {
          ...parsedPlugins,
          validPlugins: parsedPlugins.validPlugins.concat(plugin.default),
        };
      } catch (error) {
        logger.error(`Unable to resolve plugin ${pluginName}:`, error);

        return {
          ...parsedPlugins,
          unresolvablePlugins:
            parsedPlugins.unresolvablePlugins.concat(pluginName),
        };
      }
    },
    Promise.resolve<ParsedPlugins>({
      validPlugins: [],
      invalidPlugins: [],
      unresolvablePlugins: [],
    }),
  );
};
