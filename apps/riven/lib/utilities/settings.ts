import {
  getEnvironmentData,
  isMainThread,
  setEnvironmentData,
} from "node:worker_threads";

import { InstanceSettings } from "../instance-settings.schema.ts";
import { RivenSettings } from "../riven-settings.schema.ts";
import { deepFreeze } from "./deep-freeze.ts";

import type { ReadonlyDeep } from "type-fest";

type ParsedSettings = ReadonlyDeep<RivenSettings>;

type ParsedInstanceSettings = ReadonlyDeep<InstanceSettings>;

class Settings {
  #coreSettings: ParsedSettings;

  readonly #instanceSettings: ParsedInstanceSettings;

  constructor(environment: NodeJS.ProcessEnv) {
    this.#coreSettings = this.#extractCoreSettings(environment);
    this.#instanceSettings = this.#extractInstanceSettings(environment);
  }

  get coreSettings(): ParsedSettings {
    return this.#coreSettings;
  }

  get instanceSettings(): ParsedInstanceSettings {
    return this.#instanceSettings;
  }

  #extractSettingsByPattern(pattern: RegExp, environment: NodeJS.ProcessEnv) {
    const rawSettings: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(environment)) {
      const match = pattern.exec(key);

      if (!match?.groups?.["setting"] || !value) {
        continue;
      }

      rawSettings[match.groups["setting"]] = value;

      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete environment[key];
    }

    return rawSettings;
  }

  #extractCoreSettings(environment: NodeJS.ProcessEnv) {
    if (!isMainThread) {
      const rawEnvironmentData = getEnvironmentData("settings");

      return deepFreeze(RivenSettings.parse(rawEnvironmentData));
    }

    const settingPattern = /^RIVEN_SETTING__(?<setting>.+)$/;
    const rawSettings = this.#extractSettingsByPattern(
      settingPattern,
      environment,
    );

    const parsedSettings = deepFreeze(RivenSettings.parse(rawSettings));

    setEnvironmentData("settings", parsedSettings);

    return parsedSettings;
  }

  #extractInstanceSettings(environment: NodeJS.ProcessEnv) {
    if (!isMainThread) {
      const rawInstanceEnvironmentData = getEnvironmentData("instanceSettings");

      return deepFreeze(InstanceSettings.parse(rawInstanceEnvironmentData));
    }

    const instanceSettingPattern = /^RIVEN_INSTANCE_SETTING__(?<setting>.+)$/;
    const rawInstanceSettings = this.#extractSettingsByPattern(
      instanceSettingPattern,
      environment,
    );

    const parsedSettings = deepFreeze(
      InstanceSettings.parse(rawInstanceSettings),
    );

    setEnvironmentData("instanceSettings", parsedSettings);

    return parsedSettings;
  }

  /**
   * Merges the settings from the database with the environment settings.
   *
   * @returns The merged environment and database settings
   */
  async syncCoreSettings(): Promise<ParsedSettings> {
    const { services } = await import("../database/database.ts");
    const persistedSettings =
      await services.settingsService.getSettingsByNamespace("@repo/riven");

    const parsedSettings = deepFreeze(
      RivenSettings.parse({
        ...this.#coreSettings,
        ...persistedSettings,
      }),
    );

    this.#coreSettings = parsedSettings;

    setEnvironmentData("settings", parsedSettings);

    return parsedSettings;
  }
}

export const settings = new Settings(process.env);
