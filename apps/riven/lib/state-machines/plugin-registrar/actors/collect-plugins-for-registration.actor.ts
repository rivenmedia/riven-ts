import "reflect-metadata";

import { logger } from "@repo/core-util-logger";
import {
  type RivenPlugin,
  type RivenPluginPackage,
  rivenPluginPackageSchema,
} from "@repo/util-plugin-sdk";
import { PluginSettings } from "@repo/util-plugin-sdk/utilities/plugin-settings";

import { constantCase } from "es-toolkit";
import { fromPromise } from "xstate";
import z from "zod";

import packageJson from "../../../../package.json" with { type: "json" };

import type { $ZodErrorTree } from "zod/v4/core";

export interface ParsedPlugins {
  validPlugins: RivenPlugin[];
  invalidPlugins: [string, $ZodErrorTree<RivenPluginPackage>][];
  unresolvablePlugins: string[];
  pluginConfigPrefixMap: Map<symbol, string>;
  pluginSettings: PluginSettings;
}

export const collectPluginsForRegistration = fromPromise(() => {
  const pluginNames = Object.keys(packageJson.dependencies).filter(
    (pluginName) => pluginName.startsWith("@repo/plugin-"),
  );

  // Initialise PluginSettings BEFORE importing plugins, to ensure `process.env` has been parsed.
  // Otherwise, plugins will be able to read the whole environment, including other plugins' settings.
  const pluginSettings = new PluginSettings(
    pluginNames.map(constantCase),
    logger,
  );

  return pluginNames.reduce<Promise<ParsedPlugins>>(
    async (acc, pluginName) => {
      const parsedPlugins = await acc;

      try {
        const plugin = (await import(pluginName)) as unknown;

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

        const { name: pluginSymbol } = validationResult.data.default;
        const configPrefix = constantCase(pluginName);

        return {
          ...parsedPlugins,
          pluginConfigPrefixMap: parsedPlugins.pluginConfigPrefixMap.set(
            pluginSymbol,
            configPrefix,
          ),
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
      pluginConfigPrefixMap: new Map(),
      pluginSettings,
    }),
  );
});
