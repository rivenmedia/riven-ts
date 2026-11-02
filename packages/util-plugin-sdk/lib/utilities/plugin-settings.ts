import { getLeafPaths, resolveSettings } from "./settings/index.ts";

import type { ResolvedSettings } from "./settings/index.ts";
import type { Jsonifiable, ReadonlyDeep } from "type-fest";
import type { Logger } from "winston";
import type { z, ZodObject } from "zod";

function deepFreeze<T>(obj: T) {
  for (const value of Object.values(obj as Record<string, Jsonifiable>)) {
    if (!Object.isFrozen(value)) {
      deepFreeze(value);
    }
  }

  return Object.freeze(obj) as ReadonlyDeep<T>;
}

/**
 * A class to manage and retrieve plugin settings based on provided Zod schemas.
 */
export class PluginSettings {
  /**
   * A map to hold environment settings extracted from process.env
   */
  readonly #environmentSettingGroups: Map<string, Map<string, string>>;

  /**
   * A map to hold parsed settings for each schema.
   */
  readonly #settingsMap = new Map<ZodObject, Record<string, unknown>>();

  /**
   * A flag to indicate if the settings are locked. The settings are locked once all plugins have been registered.
   *
   * This is to prevent rogue plugins from modifying
   */
  #isLocked = false;

  /**
   * Logger instance for logging warnings and errors.
   */
  readonly #logger: Logger;

  /**
   * A flag to determine whether to print the effective configuration on startup.
   *
   * This is useful for debugging configuration issues.
   */
  readonly #printConfig: boolean;

  /**
   * Initialises the PluginSettings instance and builds a map of plugin-related environment variables
   */
  public constructor(
    environment: NodeJS.ProcessEnv,
    pluginConfigPrefixes: string[],
    logger: Logger,
    printConfig: boolean,
  ) {
    this.#logger = logger;
    this.#printConfig = printConfig;

    this.#environmentSettingGroups = new Map(
      pluginConfigPrefixes.map((prefix) => [prefix, new Map<string, string>()]),
    );

    const settingPattern = new RegExp(
      `^RIVEN_PLUGIN_SETTING__(?<prefix>${pluginConfigPrefixes.join("|")})__(?<settingName>.+)$`,
      "u",
    );

    for (const [key, value] of Object.entries(environment)) {
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

      settingGroup.set(settingName, value);

      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete environment[key];
    }
  }

  /**
   * Locks the settings to prevent further modifications.
   *
   * @internal
   */
  public lock() {
    if (this.#isLocked) {
      this.#logger.warn(
        "PluginSettings.lock() called multiple times. This is a no-op.",
      );

      return;
    }

    this.#isLocked = true;

    for (const [key, value] of this.#settingsMap.entries()) {
      // Freeze each settings object to prevent further modifications.
      this.#settingsMap.set(key, deepFreeze(value));
    }

    for (const [prefix, settings] of this.#environmentSettingGroups) {
      if (settings.size > 0) {
        const unusedSettings = [...settings.keys()].map(
          (key) => `${prefix}_${key}`,
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
   * Returns a copy of the raw environment settings for each config prefix.
   *
   * Core uses this to compute locked fields after the settings have been locked;
   * it is not available afterwards so plugins can never read it.
   *
   * @internal
   *
   * @throws {Error} if settings are locked
   */
  public getEnvironmentSnapshot(): ReadonlyMap<
    string,
    Readonly<Record<string, string>>
  > {
    if (this.#isLocked) {
      throw new Error(
        "The plugin environment is no longer available after the settings have been locked.",
      );
    }

    return new Map(
      [...this.#environmentSettingGroups].map(([prefix, settings]) => [
        prefix,
        Object.freeze(Object.fromEntries(settings)),
      ]),
    );
  }

  /**
   * Resolves and persists settings for a given schema, using env > stored > schema default.
   *
   * @internal
   *
   * @param configPrefix The config prefix associated with the plugin.
   * @param schema The schema that should be used to parse the settings.
   * @param stored The stored (database) values for the plugin, keyed by leaf.
   * @returns The resolved settings, including any stored values that were ignored.
   * @throws {Error} if settings are locked
   * @throws {z.ZodError} if the settings are invalid
   */
  public set<T extends ZodObject>(
    configPrefix: string,
    schema: T,
    stored: Record<string, unknown>,
  ): ResolvedSettings<T> {
    if (this.#isLocked) {
      throw new Error("Settings are locked and cannot be modified.");
    }

    const rawPluginSettings = this.#environmentSettingGroups.get(configPrefix);

    if (!rawPluginSettings) {
      throw new Error(
        `No environment settings found for plugin with config prefix: ${configPrefix}`,
      );
    }

    const resolved = resolveSettings({
      schema,
      stored,
      env: Object.fromEntries(rawPluginSettings),
    });

    this.#settingsMap.set(schema, resolved.value);

    for (const key of getLeafPaths(schema).keys()) {
      rawPluginSettings.delete(key);
    }

    if (this.#printConfig) {
      console.debug("#################");
      console.debug(`Effective ${configPrefix} configuration:`);
      console.debug(resolved.value);
      console.debug("#################");
    }

    return resolved;
  }

  /**
   * Retrieves the evaluated plugin settings object.
   *
   * @param schema The Zod schema used to parse the settings.
   * @returns The parsed settings for the provided schema.
   */
  public get<T extends ZodObject>(schema: T): z.infer<T> {
    if (!this.#settingsMap.has(schema)) {
      throw new Error("Schema not found in settings map.");
    }

    return this.#settingsMap.get(schema) as z.infer<T>;
  }
}
