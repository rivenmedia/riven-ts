import { PluginSettings } from "@repo/util-plugin-sdk/utilities/plugin-settings";

import { mockLogger } from "./create-mock-logger.ts";

import type { ZodObject, z } from "zod";

export const createMockPluginSettings = <T extends ZodObject>(
  schema: T,
  settings: z.input<T> | z.output<T>,
) => {
  const mockPluginKey = schema.constructor.name;
  const env: Record<string, string> = {};

  for (const [key, value] of Object.entries(settings)) {
    env[`RIVEN_PLUGIN_SETTING__${mockPluginKey}__${key}`] =
      JSON.stringify(value);
  }

  const pluginSettings = new PluginSettings(env, [mockPluginKey], mockLogger);

  pluginSettings._set(mockPluginKey, schema);

  return pluginSettings;
};
