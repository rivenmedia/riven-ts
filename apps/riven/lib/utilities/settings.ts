import {
  getEnvironmentData,
  isMainThread,
  setEnvironmentData,
} from "node:worker_threads";

import { RivenSettings } from "#riven-settings.schema.ts";

import { deepFreeze } from "./deep-freeze.ts";

import type { ReadonlyDeep } from "type-fest";

/**
 * Extracts every `RIVEN_SETTING__<key>` entry from the environment,
 * removing it from the environment so it cannot leak elsewhere.
 */
function extractCoreEnvironment(environment: NodeJS.ProcessEnv) {
  const settingPattern = /^RIVEN_SETTING__(?<setting>.+)$/u;

  const rawSettings: Record<string, string> = {};

  for (const [key, value] of Object.entries(environment)) {
    const match = settingPattern.exec(key);

    if (!match?.groups?.["setting"] || !value) {
      continue;
    }

    rawSettings[match.groups["setting"]] = value;

    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    delete environment[key];
  }

  setEnvironmentData("settings", rawSettings);

  return rawSettings;
}

/**
 * All raw `RIVEN_SETTING__` entries, captured before they were removed from the environment.
 *
 * Includes both bootstrap and runtime settings keys.
 */
export const coreEnvironment: Readonly<Record<string, string>> = Object.freeze(
  isMainThread
    ? extractCoreEnvironment(process.env)
    : (getEnvironmentData("settings") as Record<string, string>),
);

function parseBootstrapSettings() {
  const parsedSettings = deepFreeze(RivenSettings.parse(coreEnvironment));

  if (isMainThread && parsedSettings.printConfigurationOnStartup) {
    console.debug("#################");
    console.debug("Effective core configuration:");
    console.debug(parsedSettings);
    console.debug("#################");
  }

  return parsedSettings;
}

/** The env-only bootstrap settings, available as soon as this module loads. */
export const settings: ReadonlyDeep<RivenSettings> = parseBootstrapSettings();
