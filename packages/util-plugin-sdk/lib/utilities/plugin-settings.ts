import { camelCase, constantCase } from "es-toolkit";
import { type ZodObject, z } from "zod";

import type { Logger } from "winston";

/**
 * A class to manage and retrieve plugin settings based on provided Zod schemas.
 */
export class PluginSettings {
  /**
   * A map to hold environment settings extracted from process.env
   */
  #environmentSettingGroups: Map<string, Map<string, string>>;

  /**
   * A map to hold parsed settings for each schema.
   */
  #settingsMap = new Map<ZodObject, unknown>();

  /**
   * A flag to indicate if the settings are locked. The settings are locked once all plugins have been registered.
   *
   * This is to prevent rogue plugins from modifying
   */
  #isLocked = false;

  /**
   * Logger instance for logging warnings and errors.
   */
  #logger: Logger;

  /**
   * Initialises the PluginSettings instance and builds a map of plugin-related environment variables
   */
  constructor(pluginConfigPrefixes: string[], logger: Logger) {
    this.#logger = logger;

    this.#environmentSettingGroups = new Map(
      pluginConfigPrefixes.map((prefix) => [prefix, new Map<string, string>()]),
    );

    const settingPattern = new RegExp(
      `^RIVEN_PLUGIN_SETTING_(?<prefix>${pluginConfigPrefixes.join("|")})_(?<settingName>.+)$`,
    );

    for (const [key, value] of Object.entries(process.env)) {
      const match = settingPattern.exec(key);

      if (!match?.groups || !value) {
        continue;
      }

      const { prefix, settingName } = match.groups;

      if (!prefix || !settingName) {
        this.#logger.warn(
          `Failed to parse plugin setting from environment variable: ${key}. Found prefix: ${String(prefix)}, settingName: ${String(settingName)}`,
        );

        continue;
      }

      const settingGroup = this.#environmentSettingGroups.get(prefix);

      if (!settingGroup) {
        this.#logger.warn(
          `No setting group found for prefix: ${prefix} while processing environment variable: ${key}`,
        );

        continue;
      }

      settingGroup.set(camelCase(settingName), value);

      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete process.env[key];
    }
  }

  /**
   * Locks the settings to prevent further modifications.
   *
   * @internal
   */
  _lock() {
    if (this.#isLocked) {
      this.#logger.warn("PluginSettings._lock() called multiple times.");

      return;
    }

    this.#isLocked = true;

    for (const [prefix, settings] of this.#environmentSettingGroups) {
      if (settings.size > 0) {
        const unusedSettings = Array.from(settings.keys()).map(
          (key) => `${prefix}_${constantCase(key)}`,
        );

        this.#logger.warn(
          `Unused plugin settings: ${unusedSettings.join(", ")}`,
        );
      }

      this.#environmentSettingGroups.delete(prefix);
    }

    this.#logger.verbose("Plugin settings have been locked.");
  }

  /**
   * Persists settings for a given schema.
   *
   * @internal
   *
   * @param configPrefix The config prefix associated with the plugin.
   * @param schema The schema that should be used to parse the settings.
   * @throws {Error} if settings are locked
   */
  _set(configPrefix: string, schema: ZodObject): void {
    if (this.#isLocked) {
      throw new Error("Settings are locked and cannot be modified.");
    }

    const rawPluginSettings = this.#environmentSettingGroups.get(configPrefix);

    if (!rawPluginSettings) {
      throw new Error(
        `No environment settings found for plugin with config prefix: ${configPrefix}`,
      );
    }

    const parsedSettings = schema.parse(
      Object.fromEntries(
        [...rawPluginSettings].map(([key, value]) => [key, value]),
      ),
    );

    this.#settingsMap.set(schema, parsedSettings);

    for (const key of Object.keys(parsedSettings)) {
      rawPluginSettings.delete(key);
    }
  }

  /**
   * Retrieves the evaluated plugin settings object.
   *
   * @param schema The Zod schema used to parse the settings.
   * @returns The parsed settings for the provided schema.
   */
  get<T extends ZodObject>(schema: T): z.infer<T> {
    if (!this.#settingsMap.has(schema)) {
      throw new Error("Schema not found in settings map.");
    }

    return this.#settingsMap.get(schema) as z.infer<T>;
  }
}
