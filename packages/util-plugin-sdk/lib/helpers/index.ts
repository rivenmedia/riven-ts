import { isRivenPluginPackage, RivenPlugin } from "../index.ts";
import { logger } from "@repo/core-util-logger";
import type { PackageJson } from "type-fest";

export const parsePluginsFromDependencies = async (
  dependencies: PackageJson.Dependency,
  importResolver: ImportMeta["resolve"],
) => {
  const invalidPluginSymbol = Symbol("InvalidPlugin");

  const plugins = await Promise.all(
    Object.keys(dependencies)
      .filter((pluginName) => pluginName.startsWith("@repo/plugin-"))
      .map(async (pluginName) => {
        try {
          const plugin = (await import(importResolver(pluginName))) as unknown;

          if (!isRivenPluginPackage(plugin)) {
            throw new Error(`Plugin ${pluginName} is not a valid RivenPlugin`);
          }

          return RivenPlugin.parse(plugin.default);
        } catch (error) {
          logger.error(`Failed to load plugin ${pluginName}:`, error);

          return {
            name: invalidPluginSymbol,
          };
        }
      }),
  );

  return plugins.filter(
    (plugin): plugin is RivenPlugin => plugin.name !== invalidPluginSymbol,
  );
};
