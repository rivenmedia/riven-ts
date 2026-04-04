import { PluginSettings } from "@repo/util-plugin-sdk/utilities/plugin-settings";

import { Type } from "arktype";

import { mockLogger } from "./create-mock-logger.ts";

export const createMockPluginSettings = <
  T extends Type<Record<string, unknown>>,
>(
  schema: T,
  settings: T["in"],
) => {
  const mockPluginKey = schema.constructor.name;
  const env: Record<string, string> = {};

  for (const [key, value] of Object.entries(settings)) {
    env[`RIVEN_PLUGIN_SETTING__${mockPluginKey}__${key}`] = String(value);
  }

  const pluginSettings = new PluginSettings(env, [mockPluginKey], mockLogger);

  pluginSettings._set(mockPluginKey, schema);

  return pluginSettings;
};
