import assert from "node:assert";
import { fromPromise } from "xstate";

import { services } from "../../../database/database.ts";
import { Setting } from "../../../database/entities/settings.entity.js";

import type { ValidPluginMap } from "../../../types/plugins.ts";
import type { ParsedSettings } from "../../../utilities/settings.ts";
import type { PluginSettings } from "@repo/util-plugin-sdk/utilities/plugin-settings";

export interface SynchroniseConfigurationInput {
  coreSettings: ParsedSettings;
  pluginSettings: PluginSettings;
  validPlugins: ValidPluginMap;
}

export const synchroniseConfiguration = fromPromise<
  undefined,
  SynchroniseConfigurationInput
>(async ({ input: { coreSettings, pluginSettings, validPlugins } }) => {
  function formatSettings(
    namespace: string,
    settingsObject: Record<string, unknown>,
  ): Setting[] {
    return Object.entries(settingsObject).map(([key, value]) => {
      const setting = new Setting();

      setting.key = key;
      setting.namespace = namespace;
      setting.value = value;

      return setting;
    });
  }

  const settingsMap = new Map<string, Setting[]>([
    ["@repo/riven", formatSettings("@repo/riven", coreSettings)],
  ]);

  for (const [name, { config }] of validPlugins) {
    assert(name.description, "Plugin name symbol must have a description");

    settingsMap.set(
      name.description,
      formatSettings(
        name.description,
        pluginSettings.get(config.settingsSchema),
      ),
    );
  }

  await services.settingsService.saveBulkSettings(
    Array.from(settingsMap.values()).flat(),
  );
});
