import { logger } from "@repo/core-util-logger";

import type { PackageJson } from "type-fest";
import { z } from "zod";
import type { $ZodErrorTree } from "zod/v4/core";

import {
  type RivenPlugin,
  type RivenPluginPackage,
  rivenPluginPackageSchema,
} from "../schemas/index.ts";

export interface ParsedPlugins {
  validPlugins: RivenPlugin[];
  invalidPlugins: [string, $ZodErrorTree<RivenPluginPackage>][];
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

        const validationResult =
          await rivenPluginPackageSchema.safeParseAsync(plugin);

        if (!validationResult.success) {
          return {
            ...parsedPlugins,
            invalidPlugins: parsedPlugins.invalidPlugins.concat([
              pluginName,
              z.treeifyError(validationResult.error),
            ]),
          };
        }

        return {
          ...parsedPlugins,
          validPlugins: parsedPlugins.validPlugins.concat(
            validationResult.data.default,
          ),
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
