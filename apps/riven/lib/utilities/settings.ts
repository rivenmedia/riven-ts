import {
  getEnvironmentData,
  isMainThread,
  setEnvironmentData,
} from "node:worker_threads";

import { RivenSettings } from "../riven-settings.schema.ts";
import { deepFreeze } from "./deep-freeze.ts";

import type { ReadonlyDeep } from "type-fest";

class Settings {
  public readonly settings: ReadonlyDeep<RivenSettings>;

  public constructor(environment: NodeJS.ProcessEnv) {
    const settingPattern = /^RIVEN_SETTING__(?<setting>.+)$/u;

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

    this.settings = deepFreeze(RivenSettings.parse(rawSettings));

    if (this.settings.printConfigurationOnStartup) {
      console.debug("#################");
      console.debug("Effective core configuration:");
      console.debug(this.settings);
      console.debug("#################");
    }

    setEnvironmentData("settings", rawSettings);
  }
}

function getWorkerSettings() {
  const rawEnvironmentData = getEnvironmentData("settings");
  const parsedEnvironmentData = RivenSettings.parse(rawEnvironmentData);

  return deepFreeze(parsedEnvironmentData);
}

export const settings: ReadonlyDeep<RivenSettings> = isMainThread
  ? new Settings(process.env).settings
  : getWorkerSettings();
