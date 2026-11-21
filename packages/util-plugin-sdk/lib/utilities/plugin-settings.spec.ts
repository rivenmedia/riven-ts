import { expect, it, vi } from "vitest";
import { createLogger } from "winston";
import z from "zod";

import { PluginSettings } from "./plugin-settings.ts";

const logger = createLogger({ silent: true });

const PREFIX = "REPO_PLUGIN_EXAMPLE";

const schema = z.object({
  enabled: z.boolean().default(false),
  url: z.url().default("https://example.com"),
});

function createPluginSettings(environment: NodeJS.ProcessEnv = {}) {
  return new PluginSettings(environment, [PREFIX], logger, false);
}

it("removes the plugin settings from the environment", () => {
  const environment = {
    [`RIVEN_PLUGIN_SETTING__${PREFIX}__enabled`]: "true",
    OTHER: "value",
  };

  createPluginSettings(environment);

  expect(environment).toStrictEqual({ OTHER: "value" });
});

it("returns the frozen settings after lock()", () => {
  const pluginSettings = createPluginSettings();

  pluginSettings.set(
    PREFIX,
    schema,
    { enabled: true, url: "https://example.com" },
    [],
  );
  pluginSettings.lock();

  const value = pluginSettings.get(schema);

  expect(value).toStrictEqual({ enabled: true, url: "https://example.com" });
  expect(Object.isFrozen(value)).toBe(true);
});

it("warns about environment settings that were not consumed on lock()", () => {
  const warn = vi.spyOn(logger, "warn");
  const pluginSettings = createPluginSettings({
    [`RIVEN_PLUGIN_SETTING__${PREFIX}__enabled`]: "true",
    [`RIVEN_PLUGIN_SETTING__${PREFIX}__unknown`]: "value",
  });

  pluginSettings.set(
    PREFIX,
    schema,
    { enabled: true, url: "https://example.com" },
    ["enabled", "url"],
  );
  pluginSettings.lock();

  expect(warn).toHaveBeenCalledExactlyOnceWith(
    `Unused plugin settings: ${PREFIX}_unknown`,
  );
});

it("throws when setting an unknown config prefix", () => {
  const pluginSettings = createPluginSettings();

  expect(() => {
    pluginSettings.set(
      "UNKNOWN",
      schema,
      { enabled: false, url: "https://example.com" },
      [],
    );
  }).toThrow(
    "No environment settings found for plugin with config prefix: UNKNOWN",
  );
});

it("throws when setting after lock()", () => {
  const pluginSettings = createPluginSettings();

  pluginSettings.lock();

  expect(() => {
    pluginSettings.set(
      PREFIX,
      schema,
      { enabled: false, url: "https://example.com" },
      [],
    );
  }).toThrow("Settings are locked and cannot be modified.");
});

it("returns a snapshot of the raw environment groups before lock()", () => {
  const pluginSettings = createPluginSettings({
    [`RIVEN_PLUGIN_SETTING__${PREFIX}__enabled`]: "true",
  });

  const snapshot = pluginSettings.getEnvironmentSnapshot();

  pluginSettings.set(
    PREFIX,
    schema,
    { enabled: true, url: "https://example.com" },
    ["enabled"],
  );

  expect(snapshot).toStrictEqual(new Map([[PREFIX, { enabled: "true" }]]));
});

it("throws when the environment snapshot is requested after lock()", () => {
  const pluginSettings = createPluginSettings();

  pluginSettings.lock();

  expect(() => pluginSettings.getEnvironmentSnapshot()).toThrow(
    "The plugin environment is no longer available after the settings have been locked.",
  );
});
it("deeply freezes nested settings after lock()", () => {
  const nestedSchema = z.object({
    servers: z.array(z.object({ url: z.url() })),
  });
  const pluginSettings = createPluginSettings();

  pluginSettings.set(
    PREFIX,
    nestedSchema,
    { servers: [{ url: "https://example.com" }] },
    [],
  );
  pluginSettings.lock();

  const { servers } = pluginSettings.get(nestedSchema);

  expect(Object.isFrozen(servers)).toBe(true);
  expect(Object.isFrozen(servers[0])).toBe(true);
});

it("keeps the locked settings when lock() is called again", () => {
  const warn = vi.spyOn(logger, "warn");
  const pluginSettings = createPluginSettings();

  pluginSettings.set(
    PREFIX,
    schema,
    { enabled: true, url: "https://example.com" },
    [],
  );
  pluginSettings.lock();
  pluginSettings.lock();

  expect(warn).toHaveBeenCalledExactlyOnceWith(
    "PluginSettings.lock() called multiple times. This is a no-op.",
  );
  expect(pluginSettings.get(schema)).toStrictEqual({
    enabled: true,
    url: "https://example.com",
  });
});

it("throws when getting the settings of an unknown schema", () => {
  const pluginSettings = createPluginSettings();

  expect(() => pluginSettings.get(schema)).toThrow(
    "Schema not found in settings map.",
  );
});

it("prints the effective configuration when enabled", () => {
  const debug = vi.spyOn(console, "debug").mockImplementation(vi.fn());
  const pluginSettings = new PluginSettings({}, [PREFIX], logger, true);
  const value = { enabled: true, url: "https://example.com" };

  pluginSettings.set(PREFIX, schema, value, []);

  expect(debug).toHaveBeenCalledWith(`Effective ${PREFIX} configuration:`);
  expect(debug).toHaveBeenCalledWith(value);
});
