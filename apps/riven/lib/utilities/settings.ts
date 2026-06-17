import {
  getEnvironmentData,
  isMainThread,
  setEnvironmentData,
} from "node:worker_threads";

import { RivenSettings } from "../riven-settings.schema.ts";
import { deepFreeze } from "./deep-freeze.ts";

import type { ReadonlyDeep } from "type-fest";

type ParsedSettings = ReadonlyDeep<RivenSettings>;

/**
 * A class that manages the settings for Riven.
 *
 * Settings that reside here are persistable to the database.
 */
class Settings {
  #settings: ParsedSettings;

  get settings(): ParsedSettings {
    return this.#settings;
  }

  constructor(environment: NodeJS.ProcessEnv) {
    this.#settings = isMainThread
      ? this.#extractProcessEnvironment(environment)
      : this.#extractWorkerEnvironment();
  }

  #extractProcessEnvironment(environment: NodeJS.ProcessEnv) {
    const settingPattern = /^RIVEN_SETTING__(?<setting>.+)$/;

    const rawSettings: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(environment)) {
      const match = settingPattern.exec(key);

      if (!match?.groups?.["setting"] || !value) {
        continue;
      }

      rawSettings[match.groups["setting"]] = value;

      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete environment[key];
    }

    const parsedSettings = deepFreeze(RivenSettings.parse(rawSettings));

    setEnvironmentData("settings", parsedSettings);

    return parsedSettings;
  }

  #extractWorkerEnvironment() {
    const rawEnvironmentData = getEnvironmentData("settings");
    const parsedEnvironmentData = RivenSettings.parse(rawEnvironmentData);

    return deepFreeze(parsedEnvironmentData);
  }

  /**
   * Returns a single setting.
   *
   * @param key The setting key to return.
   * @returns The value of the requested setting.
   */
  get<T extends keyof ParsedSettings>(key: T): ParsedSettings[T];

  /**
   * Picks a subset of settings based on the keys provided.
   *
   * @param keys A list of setting keys to return.
   * @returns An object containing the requested settings.
   */
  get<T extends keyof ParsedSettings>(keys: T[]): Pick<ParsedSettings, T>;

  get<T extends keyof ParsedSettings>(
    keys: T[] | T,
  ): Pick<ParsedSettings, T> | ParsedSettings[T] {
    if (!Array.isArray(keys)) {
      return this.#settings[keys];
    }

    return Object.fromEntries(
      keys.map((key) => [key, this.#settings[key]]),
    ) as Pick<ParsedSettings, T>;
  }

  /**
   * Merges the settings from the database with the environment settings.
   *
   * @returns The merged environment and database settings
   */
  async sync(): Promise<ParsedSettings> {
    const { services } = await import("../database/database.ts");
    const persistedSettings =
      await services.settingsService.getSettingsByNamespace("@repo/riven");

    const parsedSettings = deepFreeze(
      RivenSettings.parse({
        ...this.#settings,
        ...persistedSettings,
      }),
    );

    this.#settings = parsedSettings;

    setEnvironmentData("settings", parsedSettings);

    return parsedSettings;
  }
}

export const settings = new Settings(process.env);
