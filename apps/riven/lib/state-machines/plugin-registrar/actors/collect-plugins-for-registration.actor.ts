import { RivenPluginPackage } from "@repo/util-plugin-sdk";
import { PluginSettings } from "@repo/util-plugin-sdk/utilities/plugin-settings";

import chalk from "chalk";
import { constantCase } from "es-toolkit";
import { fromPromise } from "xstate";
import z from "zod";

import { CorePlugins } from "#schemas/core-plugins.schema.ts";
import { toPluginSectionId } from "#settings/utilities/to-plugin-section-id.ts";
import { logger } from "#utilities/logger/logger.ts";
import { getRuntimeSettings } from "#utilities/runtime-settings.ts";
import { settings } from "#utilities/settings.ts";

import type { SettingsService } from "#database/services/settings/settings.service.ts";
import type { CorePluginName } from "#schemas/core-plugins.schema.ts";
import type { InstalledPlugin } from "#types/plugins.ts";
import type { RivenPlugin } from "@repo/util-plugin-sdk";
import type { PackageJson } from "type-fest";

export interface ParsedPlugins {
  validPlugins: RivenPlugin[];
  invalidPlugins: Map<string, string>;
  unresolvablePlugins: string[];
  pluginConfigPrefixMap: Map<symbol, string>;
  pluginSettings: PluginSettings;
  /** Every installed plugin with a valid package, enabled or not. */
  installedPlugins: InstalledPlugin[];
  /** The raw plugin environment settings, keyed by package name. */
  pluginEnvironment: ReadonlyMap<string, Readonly<Record<string, string>>>;
  /** The stored plugin settings, keyed by package name. */
  storedPluginSettings: Map<string, Record<string, unknown>>;
}

export interface CollectPluginsForRegistrationInput {
  settingsService: SettingsService;
}

const PLUGIN_NAME_PATTERN = /^@repo\/plugin-(?<pluginName>[a-z0-9-]+)$/u;

const permanentlyEnabledPlugins = new Set<CorePluginName>(["tmdb", "tvdb"]);

/**
 * @throws if two package names resolve to the same settings section id
 */
function assertUniqueSectionIds(packageNames: string[]) {
  const packageNamesBySectionId = new Map<string, string>();

  for (const packageName of packageNames) {
    const sectionId = toPluginSectionId(packageName);
    const existingPackageName = packageNamesBySectionId.get(sectionId);

    if (existingPackageName) {
      throw new Error(
        `Plugins "${existingPackageName}" and "${packageName}" both resolve to the settings section id "${sectionId}".`,
      );
    }

    packageNamesBySectionId.set(sectionId, packageName);
  }
}

export const collectPluginsForRegistration = fromPromise<
  ParsedPlugins,
  CollectPluginsForRegistrationInput
>(async ({ input: { settingsService } }) => {
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
    settings.printConfigurationOnStartup,
  );

  // The snapshot is only kept in core; it is unavailable from `pluginSettings` once locked.
  const environmentSnapshot = pluginSettings.getEnvironmentSnapshot();

  assertUniqueSectionIds(pluginNames);

  const parsedPlugins: ParsedPlugins = {
    invalidPlugins: new Map(),
    pluginConfigPrefixMap: new Map(),
    pluginSettings,
    unresolvablePlugins: [],
    validPlugins: [],
    installedPlugins: [],
    pluginEnvironment: new Map(
      pluginNames.map((pluginName) => [
        pluginName,
        environmentSnapshot.get(constantCase(pluginName)) ?? {},
      ]),
    ),
    storedPluginSettings:
      await settingsService.getStoredValuesByNamespace(pluginNames),
  };

  const { enabledPlugins } = getRuntimeSettings().plugins;

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

    const alwaysEnabled = permanentlyEnabledPlugins.has(
      validatedPluginName.data,
    );

    const enabled =
      alwaysEnabled || enabledPlugins.includes(validatedPluginName.data);

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

      parsedPlugins.installedPlugins.push({
        sectionId: toPluginSectionId(pluginName),
        packageName: pluginName,
        name: validatedPluginName.data,
        plugin: validationResult.data.plugin,
        enabled,
        alwaysEnabled,
      });

      if (!enabled) {
        logger.info(
          `Plugin ${chalk.bold(pluginName)} is not enabled, skipping registration.`,
        );

        continue;
      }

      const { name: pluginSymbol } = validationResult.data.plugin;

      parsedPlugins.pluginConfigPrefixMap.set(
        pluginSymbol,
        constantCase(pluginName),
      );
      parsedPlugins.validPlugins.push(validationResult.data.plugin);
    } catch (error) {
      logger.error(`Unable to resolve plugin ${pluginName}:`, { err: error });

      parsedPlugins.unresolvablePlugins.push(pluginName);
    }
  }

  return parsedPlugins;
});
