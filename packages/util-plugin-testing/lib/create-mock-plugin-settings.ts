import { PluginSettings } from "@repo/util-plugin-sdk/utilities/plugin-settings";
import { flattenSettings } from "@repo/util-plugin-sdk/utilities/settings";

import { mockLogger } from "./create-mock-logger.ts";

import type { ZodObject, z } from "zod";

/**
 * Creates a `PluginSettings` instance with the given settings applied as stored values.
 *
 * @throws if any of the given settings are invalid for the schema
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

  const { ignoredStored } = pluginSettings.set(
    mockPluginKey,
    schema,
    flattenSettings(schema, settings as Record<string, unknown>),
  );

  if (ignoredStored.length > 0) {
    throw new Error(
      `Invalid mock plugin settings: ${ignoredStored
        .map(({ path, message }) => `${path}: ${message}`)
        .join(", ")}`,
    );
  }

  return pluginSettings;
};
