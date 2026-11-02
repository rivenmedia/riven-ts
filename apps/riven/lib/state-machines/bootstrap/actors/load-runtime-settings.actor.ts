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
import type { SettingsIssue } from "@repo/util-plugin-sdk/utilities/settings";
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
  const issues = new Map<string, SettingsIssue[]>();

  function resolveSection<T extends z.ZodObject>(
    sectionId: keyof RuntimeSettings,
    schema: T,
  ) {
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

    issues.set(sectionId, ignoredStored);

    return value;
  }

  const runtimeSettings: RuntimeSettings = {
    general: resolveSection("general", coreSettingsSections.general),
    plugins: resolveSection("plugins", coreSettingsSections.plugins),
  };

  initialiseRuntimeSettings(runtimeSettings, issues);
  configureLogger(runtimeSettings.general.logging);
});
