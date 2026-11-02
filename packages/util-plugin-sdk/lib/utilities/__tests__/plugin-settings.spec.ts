import { describe, expect, it } from "vitest";
import { createLogger } from "winston";
import z from "zod";

import { PluginSettings } from "../plugin-settings.ts";

const logger = createLogger({ silent: true });

const PREFIX = "REPO_PLUGIN_EXAMPLE";

const schema = z.object({
  enabled: z.boolean().default(false),
  url: z.url().default("https://example.com"),
});

function createPluginSettings(environment: NodeJS.ProcessEnv = {}) {
  return new PluginSettings(environment, [PREFIX], logger, false);
}

describe(PluginSettings, () => {
  it("removes the plugin settings from the environment", () => {
    const environment = {
      [`RIVEN_PLUGIN_SETTING__${PREFIX}__enabled`]: "true",
      OTHER: "value",
    };

    createPluginSettings(environment);

    expect(environment).toStrictEqual({ OTHER: "value" });
  });

  it("decodes env values by the field type and locks the env leaves", () => {
    const pluginSettings = createPluginSettings({
      [`RIVEN_PLUGIN_SETTING__${PREFIX}__enabled`]: "true",
    });

    const resolved = pluginSettings.set(PREFIX, schema, {});

    expect(resolved.value.enabled).toBe(true);
    expect(resolved.lockedLeaves.has("enabled")).toBe(true);
  });

  it("uses the stored value when the env value is absent", () => {
    const pluginSettings = createPluginSettings();

    const resolved = pluginSettings.set(PREFIX, schema, {
      url: "https://stored.example.com",
    });

    expect(resolved.value.url).toBe("https://stored.example.com");
    expect(resolved.lockedLeaves.size).toBe(0);
  });

  it("prefers the env value over the stored value", () => {
    const pluginSettings = createPluginSettings({
      [`RIVEN_PLUGIN_SETTING__${PREFIX}__url`]: "https://env.example.com",
    });

    const resolved = pluginSettings.set(PREFIX, schema, {
      url: "https://stored.example.com",
    });

    expect(resolved.value.url).toBe("https://env.example.com");
  });

  it("reports invalid stored values and falls back to the default", () => {
    const pluginSettings = createPluginSettings();

    const resolved = pluginSettings.set(PREFIX, schema, { url: "not a url" });

    expect(resolved.value.url).toBe("https://example.com");
    expect(resolved.ignoredStored).toStrictEqual([
      { path: "url", message: expect.any(String) as string },
    ]);
  });

  it("throws when the settings are invalid", () => {
    const pluginSettings = createPluginSettings();

    expect(() =>
      pluginSettings.set(PREFIX, z.object({ token: z.string() }), {}),
    ).toThrow(z.ZodError);
  });

  it("returns the frozen settings after lock()", () => {
    const pluginSettings = createPluginSettings();

    pluginSettings.set(PREFIX, schema, { enabled: true });
    pluginSettings.lock();

    const value = pluginSettings.get(schema);

    expect(value).toStrictEqual({ enabled: true, url: "https://example.com" });
    expect(Object.isFrozen(value)).toBe(true);
  });

  it("throws when setting after lock()", () => {
    const pluginSettings = createPluginSettings();

    pluginSettings.lock();

    expect(() => pluginSettings.set(PREFIX, schema, {})).toThrow(
      "Settings are locked and cannot be modified.",
    );
  });

  it("returns a snapshot of the raw environment groups before lock()", () => {
    const pluginSettings = createPluginSettings({
      [`RIVEN_PLUGIN_SETTING__${PREFIX}__enabled`]: "true",
    });

    const snapshot = pluginSettings.getEnvironmentSnapshot();

    pluginSettings.set(PREFIX, schema, {});

    expect(snapshot).toStrictEqual(new Map([[PREFIX, { enabled: "true" }]]));
  });

  it("throws when the environment snapshot is requested after lock()", () => {
    const pluginSettings = createPluginSettings();

    pluginSettings.lock();

    expect(() => pluginSettings.getEnvironmentSnapshot()).toThrow(
      "The plugin environment is no longer available after the settings have been locked.",
    );
  });
});
