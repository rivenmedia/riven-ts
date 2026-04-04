import { type RivenPlugin, RivenPluginPackage } from "@repo/util-plugin-sdk";
import { PluginSettings } from "@repo/util-plugin-sdk/utilities/plugin-settings";

import { type } from "arktype";
import { constantCase } from "es-toolkit";
import { fromPromise } from "xstate";

import packageJson from "../../../../package.json" with { type: "json" };
import { logger } from "../../../utilities/logger/logger.ts";

export interface ParsedPlugins {
  validPlugins: RivenPlugin[];
  invalidPlugins: [string, type.errors][];
  unresolvablePlugins: string[];
  pluginConfigPrefixMap: Map<symbol, string>;
  pluginSettings: PluginSettings;
}

export const collectPluginsForRegistration = fromPromise(async () => {
  const pluginNames = Object.keys(packageJson.dependencies).filter(
    (pluginName) => pluginName.startsWith("@repo/plugin-"),
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

      const validationResult = RivenPluginPackage(plugin);

      if (validationResult instanceof type.errors) {
        parsedPlugins.invalidPlugins.push([pluginName, validationResult]);

        continue;
      }

      const {
        default: { name: pluginSymbol },
      } = validationResult;

      parsedPlugins.pluginConfigPrefixMap.set(
        pluginSymbol,
        constantCase(pluginName),
      );

      parsedPlugins.validPlugins.push(validationResult.default);
    } catch (error) {
      logger.error(`Unable to resolve plugin ${pluginName}:`, { err: error });

      parsedPlugins.unresolvablePlugins.push(pluginName);
    }
  }

  return parsedPlugins;
});
