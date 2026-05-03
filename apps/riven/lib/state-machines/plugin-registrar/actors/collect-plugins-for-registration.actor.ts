import { type RivenPlugin, RivenPluginPackage } from "@repo/util-plugin-sdk";
import { PluginSettings } from "@repo/util-plugin-sdk/utilities/plugin-settings";

import chalk from "chalk";
import { constantCase } from "es-toolkit";
import { fromPromise } from "xstate";
import z from "zod";

import { CorePlugins } from "../../../riven-settings.schema.ts";
import { logger } from "../../../utilities/logger/logger.ts";
import { settings } from "../../../utilities/settings.ts";

import type { PackageJson } from "type-fest";

export interface ParsedPlugins {
  validPlugins: RivenPlugin[];
  invalidPlugins: Map<string, string>;
  unresolvablePlugins: string[];
  pluginConfigPrefixMap: Map<symbol, string>;
  pluginSettings: PluginSettings;
}

const PLUGIN_NAME_PATTERN = /^@repo\/plugin-(?<pluginName>[a-z0-9-]+)$/;

export const collectPluginsForRegistration = fromPromise(async () => {
  const { default: packageJson } = (await import(
    import.meta.resolve(`${process.cwd()}/package.json`),
    { with: { type: "json" } }
  )) as { default: PackageJson };

  const pluginNames = Object.keys(packageJson.dependencies ?? {}).filter(
    (pluginName) => PLUGIN_NAME_PATTERN.test(pluginName),
  );

  // Initialise PluginSettings BEFORE importing plugins, to ensure `process.env` has been parsed.
  // Otherwise, plugins will be able to read the whole environment, including other plugins' settings.
  const pluginSettings = new PluginSettings(
    process.env,
    pluginNames.map(constantCase),
    logger,
  );

  const parsedPlugins: ParsedPlugins = {
    invalidPlugins: new Map(),
    pluginConfigPrefixMap: new Map(),
    pluginSettings,
    unresolvablePlugins: [],
    validPlugins: [],
  };

  const permanentlyEnabledPlugins = CorePlugins.extract(["tmdb", "tvdb"]);

  for (const pluginName of pluginNames) {
    const match = PLUGIN_NAME_PATTERN.exec(pluginName);
    const validatedPluginName = CorePlugins.safeParse(
      match?.groups?.["pluginName"],
    );

    if (!validatedPluginName.success) {
      logger.warn(
        `Plugin name ${chalk.bold(pluginName)} does not match expected pattern, skipping registration.`,
      );

      continue;
    }

    if (
      !permanentlyEnabledPlugins.safeParse(validatedPluginName.data).success &&
      !settings.enabledPlugins.includes(validatedPluginName.data as never)
    ) {
      logger.info(
        `Plugin ${chalk.bold(pluginName)} is not enabled, skipping registration.`,
      );

      continue;
    }

    try {
      const plugin = (await import(pluginName)) as unknown;

      const validationResult = await RivenPluginPackage.safeParseAsync(plugin);

      if (!validationResult.success) {
        parsedPlugins.invalidPlugins.set(
          pluginName,
          z.prettifyError(validationResult.error),
        );

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
