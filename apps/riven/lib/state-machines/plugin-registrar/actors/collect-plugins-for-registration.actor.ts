import { type RivenPlugin, RivenPluginPackage } from "@rivenmedia/plugin-sdk";
import { PluginSettings } from "@rivenmedia/plugin-sdk/utilities/plugin-settings";

import { constantCase } from "es-toolkit";
import { fromPromise } from "xstate";
import z from "zod";

import { logger } from "../../../utilities/logger/logger.ts";

import type { PackageJson } from "type-fest";
import type { $ZodErrorTree } from "zod/v4/core";

export interface ParsedPlugins {
  validPlugins: RivenPlugin[];
  invalidPlugins: [string, $ZodErrorTree<typeof RivenPluginPackage>][];
  unresolvablePlugins: string[];
  pluginConfigPrefixMap: Map<symbol, string>;
  pluginSettings: PluginSettings;
}

const RIVEN_PLUGIN_PATTERN = /^((@[\w-]+(\.[\w-]+)*)\/)?(riven-plugin-[\w-]+)$/;

export const collectPluginsForRegistration = fromPromise(async () => {
  const { default: packageJson } = (await import(
    import.meta.resolve(`${process.cwd()}/package.json`),
    { with: { type: "json" } }
  )) as { default: PackageJson };

  const pluginNames = Object.keys(packageJson.dependencies ?? {}).filter(
    (pluginName) => RIVEN_PLUGIN_PATTERN.test(pluginName),
  );

  // Initialise PluginSettings BEFORE importing plugins, to ensure `process.env` has been parsed.
  // Otherwise, plugins will be able to read the whole environment, including other plugins' settings.
  const pluginSettings = new PluginSettings(
    process.env,
    pluginNames.map(constantCase),
    logger,
  );

  const parsedPlugins: ParsedPlugins = {
    invalidPlugins: [],
    pluginConfigPrefixMap: new Map(),
    pluginSettings,
    unresolvablePlugins: [],
    validPlugins: [],
  };

  for (const pluginName of pluginNames) {
    try {
      const plugin = (await import(pluginName)) as unknown;

      const validationResult = await RivenPluginPackage.safeParseAsync(plugin);

      if (!validationResult.success) {
        parsedPlugins.invalidPlugins.push([
          pluginName,
          z.treeifyError(validationResult.error),
        ]);

        continue;
      }

      const { name: pluginSymbol } = validationResult.data.default;

      parsedPlugins.pluginConfigPrefixMap.set(
        pluginSymbol,
        constantCase(pluginName),
      );
      parsedPlugins.validPlugins.push(validationResult.data.default);
    } catch (error) {
      logger.error(`Unable to resolve plugin ${pluginName}:`, { err: error });

      parsedPlugins.unresolvablePlugins.push(pluginName);
    }
  }

  return parsedPlugins;
});
