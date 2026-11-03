import {
  getLeafPaths,
  resolveSettings,
} from "@repo/util-plugin-sdk/utilities/settings";

import { fromPromise } from "xstate";

import {
  CORE_NAMESPACE,
  coreSettingsSections,
} from "#settings/core-settings-sections.ts";
import { configureLogger, logger } from "#utilities/logger/logger.ts";
import { initialiseRuntimeSettings } from "#utilities/runtime-settings.ts";

import type { SettingsService } from "#database/services/settings/settings.service.ts";
import type { RuntimeSettings } from "#settings/core-settings-sections.ts";
import type { z } from "zod";

export interface LoadRuntimeSettingsInput {
  settingsService: SettingsService;
  environment: Readonly<Record<string, string>>;
}

export const loadRuntimeSettings = fromPromise<
  undefined,
  LoadRuntimeSettingsInput
>(async ({ input: { settingsService, environment } }) => {
  const stored = await settingsService.getStoredValues(CORE_NAMESPACE);

  function resolveSection<T extends z.ZodObject>(schema: T) {
    const { value, ignoredStored } = resolveSettings({
      schema,
      stored,
      env: environment,
    });
    const leaves = getLeafPaths(schema);

    for (const issue of ignoredStored) {
      const key = issue.path.split(".").find((segment) => leaves.has(segment));

      logger.warn(
        `Ignoring invalid stored setting "${key ?? issue.path}" in namespace "${CORE_NAMESPACE}": ${issue.message}`,
        { namespace: CORE_NAMESPACE, key },
      );
    }

    return value;
  }

  const runtimeSettings: RuntimeSettings = {
    general: resolveSection(coreSettingsSections.general),
    plugins: resolveSection(coreSettingsSections.plugins),
  };

  initialiseRuntimeSettings(runtimeSettings);
  configureLogger(runtimeSettings.general.logging);
});
