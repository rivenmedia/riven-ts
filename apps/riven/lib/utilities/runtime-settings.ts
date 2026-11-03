import {
  getEnvironmentData,
  isMainThread,
  setEnvironmentData,
} from "node:worker_threads";

import { deepFreeze } from "./deep-freeze.ts";

import type { RuntimeSettings } from "#settings/core-settings-sections.ts";
import type { SettingsIssue } from "@repo/util-plugin-sdk/utilities/settings";
import type { ReadonlyDeep } from "type-fest";

const ENVIRONMENT_DATA_KEY = "runtimeSettings";

let runtimeSettings: ReadonlyDeep<RuntimeSettings> | null = null;
let runtimeSettingsIssues: ReadonlyMap<string, SettingsIssue[]> = new Map();

/**
 * Stores the resolved runtime settings for the lifetime of the process,
 * and shares them with any worker threads created afterwards.
 *
 * Calling this again replaces the previous value.
 */
export function initialiseRuntimeSettings(
  value: RuntimeSettings,
  issues: ReadonlyMap<string, SettingsIssue[]>,
) {
  runtimeSettings = deepFreeze(value);
  runtimeSettingsIssues = new Map(issues);

  setEnvironmentData(ENVIRONMENT_DATA_KEY, runtimeSettings);
}

/**
 * Returns the runtime settings loaded during bootstrap.
 *
 * Worker threads read the settings shared by the main thread when the worker was created.
 *
 * @throws if the runtime settings have not been loaded yet.
 */
export function getRuntimeSettings(): ReadonlyDeep<RuntimeSettings> {
  if (!runtimeSettings && !isMainThread) {
    const workerSettings = getEnvironmentData(ENVIRONMENT_DATA_KEY) as
      | RuntimeSettings
      | undefined;

    if (workerSettings) {
      runtimeSettings = deepFreeze(workerSettings);
    }
  }

  if (!runtimeSettings) {
    throw new Error("Runtime settings accessed before they were loaded");
  }

  return runtimeSettings;
}

/**
 * Returns the stored values that were ignored for a section when loading the runtime settings.
 */
export function getRuntimeSettingsIssues(sectionId: string): SettingsIssue[] {
  return [...(runtimeSettingsIssues.get(sectionId) ?? [])];
}
