import { PluginSettings } from "@repo/util-plugin-sdk/utilities/plugin-settings";

import { mockLogger } from "./create-mock-logger.ts";

import type { ZodObject, z } from "zod";

/**
 * Creates a {@link PluginSettings} instance with the given settings applied.
 *
 * @throws {z.ZodError} if any of the given settings are invalid for the schema
 */
export const createMockPluginSettings = <T extends ZodObject>(
  schema: T,
  settings: z.input<T>,
) => {
  const mockPluginKey = schema.constructor.name;

  const pluginSettings = new PluginSettings(
    {},
    [mockPluginKey],
    mockLogger,
    false,
  );

  pluginSettings.set(mockPluginKey, schema, schema.parse(settings), []);

  return pluginSettings;
};
