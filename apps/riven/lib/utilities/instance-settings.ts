import {
  getEnvironmentData,
  isMainThread,
  setEnvironmentData,
} from "node:worker_threads";

import { InstanceSettings as InstanceSettingsSchema } from "../instance-settings.schema.ts";
import { deepFreeze } from "./deep-freeze.ts";

import type { ReadonlyDeep } from "type-fest";

type ParsedInstanceSettings = ReadonlyDeep<InstanceSettingsSchema>;

/**
 * A class that manages the instance settings for Riven.
 *
 * Settings that reside here are not persistable to the database and are always set via environment variables
 * to prevent the user from bricking their instance with invalid settings (e.g. providing the wrong database URL)
 */
class InstanceSettings {
  readonly #instanceSettings: ParsedInstanceSettings;

  get instanceSettings(): ParsedInstanceSettings {
    return this.#instanceSettings;
  }

  constructor(environment: NodeJS.ProcessEnv) {
    this.#instanceSettings = isMainThread
      ? this.#extractProcessEnvironment(environment)
      : this.#extractWorkerEnvironment();

    if (isMainThread && this.#instanceSettings.printConfigurationOnStartup) {
      console.log("#################");
      console.log("Effective instance configuration:");
      console.log(this.#instanceSettings);
      console.log("#################");
    }
  }

  #extractProcessEnvironment(environment: NodeJS.ProcessEnv) {
    const instanceSettingPattern = /^RIVEN_INSTANCE_SETTING__(?<setting>.+)$/;

    const rawInstanceSettings: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(environment)) {
      const instanceMatch = instanceSettingPattern.exec(key);

      if (!instanceMatch?.groups?.["setting"] || !value) {
        continue;
      }

      rawInstanceSettings[instanceMatch.groups["setting"]] = value;

      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete environment[key];
    }

    setEnvironmentData("instanceSettings", rawInstanceSettings);

    return deepFreeze(InstanceSettingsSchema.parse(rawInstanceSettings));
  }

  #extractWorkerEnvironment() {
    const rawInstanceEnvironmentData = getEnvironmentData("instanceSettings");
    const parsedInstanceEnvironmentData = InstanceSettingsSchema.parse(
      rawInstanceEnvironmentData,
    );

    return deepFreeze(parsedInstanceEnvironmentData);
  }

  /**
   * Returns a single setting.
   *
   * @param key The setting key to return.
   * @returns The value of the requested setting.
   */
  get<T extends keyof ParsedInstanceSettings>(
    key: T,
  ): ParsedInstanceSettings[T];

  /**
   * Picks a subset of settings based on the keys provided.
   *
   * @param keys A list of setting keys to return.
   * @returns An object containing the requested settings.
   */
  get<T extends keyof ParsedInstanceSettings>(
    keys: T[],
  ): Pick<ParsedInstanceSettings, T>;

  get<T extends keyof ParsedInstanceSettings>(
    keys: T[] | T,
  ): Pick<ParsedInstanceSettings, T> | ParsedInstanceSettings[T] {
    if (!Array.isArray(keys)) {
      return this.#instanceSettings[keys];
    }

    return Object.fromEntries(
      keys.map((key) => [key, this.#instanceSettings[key]]),
    ) as Pick<ParsedInstanceSettings, T>;
  }
}

export const instanceSettings = new InstanceSettings(process.env);
