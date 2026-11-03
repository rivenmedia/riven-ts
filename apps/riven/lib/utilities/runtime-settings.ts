import {
  getEnvironmentData,
  isMainThread,
  setEnvironmentData,
} from "node:worker_threads";

import { deepFreeze } from "./deep-freeze.ts";

import type { RuntimeSettings } from "#settings/core-settings-sections.ts";
import type { ReadonlyDeep } from "type-fest";

const ENVIRONMENT_DATA_KEY = "runtimeSettings";

let runtimeSettings: ReadonlyDeep<RuntimeSettings> | null = null;

/**
 * Stores the resolved runtime settings for the lifetime of the process,
 * and shares them with any worker threads created afterwards.
 *
 * Calling this again replaces the previous value.
 */
export function initialiseRuntimeSettings(value: RuntimeSettings) {
  runtimeSettings = deepFreeze(value);

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
