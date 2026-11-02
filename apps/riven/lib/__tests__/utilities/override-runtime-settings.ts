import { toMerged } from "es-toolkit";

import {
  getRuntimeSettings,
  initialiseRuntimeSettings,
} from "#utilities/runtime-settings.ts";

import type { RuntimeSettings } from "#settings/core-settings-sections.ts";
import type { PartialDeep } from "type-fest";

/**
 * Replaces the current runtime settings with a copy that has the given overrides applied.
 *
 * The test setup re-initialises the defaults before each test.
 */
export function overrideRuntimeSettings(
  overrides: PartialDeep<RuntimeSettings>,
) {
  const current = structuredClone(getRuntimeSettings()) as RuntimeSettings;

  initialiseRuntimeSettings(toMerged(current, overrides), new Map());
}
