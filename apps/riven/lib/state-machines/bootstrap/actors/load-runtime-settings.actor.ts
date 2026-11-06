import { fromPromise } from "xstate";

import {
  CORE_NAMESPACE,
  RuntimeSettings,
} from "#settings/core-settings-sections.ts";
import { resolveSettings } from "#settings/utilities/resolve-settings.ts";
import { configureLogger, logger } from "#utilities/logger/logger.ts";
import { initialiseRuntimeSettings } from "#utilities/runtime-settings.ts";

import type { SettingsService } from "#database/services/settings/settings.service.ts";

export interface LoadRuntimeSettingsInput {
  settingsService: SettingsService;
  environment: Readonly<Record<string, string>>;
}

export const loadRuntimeSettings = fromPromise<
  undefined,
  LoadRuntimeSettingsInput
>(async ({ input: { settingsService, environment } }) => {
  const stored = await settingsService.getStoredValues(CORE_NAMESPACE);

  const { value: runtimeSettings, ignoredStored } = resolveSettings({
    schema: RuntimeSettings,
    stored,
    env: environment,
  });

  for (const { leaf, message } of ignoredStored) {
    logger.warn(
      `Ignoring invalid stored setting "${leaf}" in namespace "${CORE_NAMESPACE}": ${message}`,
      { namespace: CORE_NAMESPACE, key: leaf },
    );
  }

  initialiseRuntimeSettings(runtimeSettings);
  configureLogger(runtimeSettings.general.logging);
});
