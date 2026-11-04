// The `n` leaf name comes from the settings backend plan fixture.
// oxlint-disable id-length
import { plugin as cometPlugin } from "@repo/plugin-comet";
import { plugin as notificationsPlugin } from "@repo/plugin-notifications";
import { plugin as plexPlugin } from "@repo/plugin-plex";
import { plugin as testPlugin } from "@repo/plugin-test";
import { plugin as tmdbPlugin } from "@repo/plugin-tmdb";
import { PluginSettings } from "@repo/util-plugin-sdk/utilities/plugin-settings";

import { constantCase } from "es-toolkit";
import { GraphQLError } from "graphql";
import { describe, expect, vi } from "vitest";
import { createLogger } from "winston";
import z from "zod";

import { it } from "#__tests__/test-context.ts";

import { SettingsManager } from "./settings-manager.ts";
import { buildSettingsSections } from "./settings-sections.ts";
import { getLeafPaths } from "./utilities/leaf-paths.ts";
import { resolveSettings } from "./utilities/resolve-settings.ts";

import type { Services } from "#database/database.ts";
import type { CorePluginName } from "#schemas/core-plugins.schema.ts";
import type { InstalledPlugin } from "#types/plugins.ts";

const FAKE_NAMESPACE = "@repo/plugin-fake";

const FakeSettings = z
  .object({
    apiKey: z.string().min(1).meta({ secret: true }),
    token: z.string().default("d").meta({ secret: true }),
    nested: z.object({ n: z.int().default(1) }),
  })
  .meta({ title: "Fake" });

const CLEAR_NAMESPACE = "@repo/plugin-clear";

const ClearSettings = z
  .object({
    url: z.string().min(1),
    limit: z.int().optional(),
    retries: z.int().default(3),
    interval: z.int().nullable().default(60),
  })
  .meta({ title: "Clear" });

const installedPlugins: InstalledPlugin[] = [
  {
    sectionId: "repo-plugin-comet",
    packageName: "@repo/plugin-comet",
    name: "comet",
    plugin: cometPlugin,
    enabled: false,
    alwaysEnabled: false,
  },
  {
    sectionId: "repo-plugin-plex",
    packageName: "@repo/plugin-plex",
    name: "plex",
    plugin: plexPlugin,
    enabled: false,
    alwaysEnabled: false,
  },
  {
    sectionId: "repo-plugin-test",
    packageName: "@repo/plugin-test",
    // The test package.json mock makes `test` the only valid core plugin name.
    name: "test" as CorePluginName,
    plugin: testPlugin,
    enabled: false,
    alwaysEnabled: false,
  },
  {
    sectionId: "repo-plugin-tmdb",
    packageName: "@repo/plugin-tmdb",
    name: "tmdb",
    plugin: tmdbPlugin,
    enabled: true,
    alwaysEnabled: true,
  },
];

function createManager(
  services: Services,
  options: {
    fakeEnvironment?: Record<string, string>;
    clearEnvironment?: Record<string, string>;
    coreEnvironment?: Record<string, string>;
  } = {},
) {
  const coreEnvironment = options.coreEnvironment ?? {};
  const sections = buildSettingsSections({
    installedPlugins,
    pluginEnvironment: new Map(),
    coreEnvironment,
  });

  sections.set("fake", {
    id: "fake",
    namespace: FAKE_NAMESPACE,
    title: "Fake",
    schema: FakeSettings,
    environment: options.fakeEnvironment ?? {},
  });

  sections.set("clear", {
    id: "clear",
    namespace: CLEAR_NAMESPACE,
    title: "Clear",
    schema: ClearSettings,
    environment: options.clearEnvironment ?? {},
  });

  return new SettingsManager({
    settingsService: services.settingsService,
    sections,
    installedPlugins,
    coreEnvironment,
  });
}

describe("getSection", () => {
  it("throws NOT_FOUND for an unknown section", async ({ services }) => {
    const manager = createManager(services);

    await expect(manager.getSection("nope")).rejects.toSatisfy(
      (error: unknown) =>
        error instanceof GraphQLError &&
        error.extensions["code"] === "NOT_FOUND",
    );
  });

  it("does not treat the plugins settings as a section", async ({
    services,
  }) => {
    const manager = createManager(services);

    await expect(manager.getSection("plugins")).rejects.toBeInstanceOf(
      GraphQLError,
    );
  });

  it("returns the general section with defaults", async ({ services }) => {
    const manager = createManager(services);

    const view = await manager.getSection("general");

    expect(view.id).toBe("general");
    expect(view.title).toBe("General");
    expect(view.values).toMatchObject({
      scraping: { maximumFailedAttempts: 10 },
    });
    expect(view.issues).toStrictEqual([]);
  });

  it("resolves a plugin section", async ({ services }) => {
    const manager = createManager(services);

    const view = await manager.getSection("repo-plugin-comet");

    expect(view).toMatchObject({
      id: "repo-plugin-comet",
      title: "Comet",
      values: { url: "https://comet.feels.legal" },
    });
  });

  it("merges stored, env and default values and omits secrets", async ({
    services,
  }) => {
    await services.settingsService.writeValues(FAKE_NAMESPACE, {
      upsert: { apiKey: "stored-secret-value", n: 3 },
      delete: [],
    });

    const manager = createManager(services);

    const view = await manager.getSection("fake");

    expect(view.values).toStrictEqual({ nested: { n: 3 } });
    expect(JSON.stringify(view)).not.toContain("stored-secret-value");
  });

  it("reports secret states and never exposes secret values", async ({
    services,
  }) => {
    const manager = createManager(services);

    const view = await manager.getSection("fake");
    const { jsonSchema } = view;

    expect(view.values).not.toHaveProperty("apiKey");
    expect(view.values).not.toHaveProperty("token");
    expect(view.secretStates).toStrictEqual([
      { path: "apiKey", state: "unset" },
      { path: "token", state: "default" },
    ]);
    expect(jsonSchema.properties?.["token"]).not.toHaveProperty("default");
    expect(jsonSchema.required).toContain("apiKey");
  });

  it("makes a stored secret optional in the JSON schema", async ({
    services,
  }) => {
    await services.settingsService.writeValues(FAKE_NAMESPACE, {
      upsert: { apiKey: "stored-secret-value" },
      delete: [],
    });

    const manager = createManager(services);

    const view = await manager.getSection("fake");
    const { jsonSchema } = view;

    expect(view.secretStates).toContainEqual({
      path: "apiKey",
      state: "custom",
    });
    expect(jsonSchema.required).not.toContain("apiKey");
  });

  it("does not report an ignored stored secret as custom", async ({
    services,
  }) => {
    await services.settingsService.writeValues(FAKE_NAMESPACE, {
      upsert: { apiKey: "", token: 123 },
      delete: [],
    });

    const manager = createManager(services);

    const view = await manager.getSection("fake");
    const { jsonSchema } = view;

    expect(view.secretStates).toStrictEqual([
      { path: "apiKey", state: "unset" },
      { path: "token", state: "default" },
    ]);
    expect(jsonSchema.required).toContain("apiKey");
    expect(view.issues.map(({ path }) => path)).toStrictEqual(
      expect.arrayContaining(["apiKey", "token"]),
    );
  });

  it("locks env-set fields and keeps env values private", async ({
    services,
  }) => {
    const manager = createManager(services, {
      fakeEnvironment: { apiKey: "env-secret-value", n: "5" },
    });

    const view = await manager.getSection("fake");

    expect(view.values).toStrictEqual({ nested: { n: 5 } });
    expect(view.lockedFields).toStrictEqual(["apiKey", "nested.n"]);
    expect(view.secretStates).toContainEqual({ path: "apiKey", state: "env" });
    expect(JSON.stringify(view)).not.toContain("env-secret-value");
  });

  it("only locks core env keys that belong to the section", async ({
    services,
  }) => {
    const manager = createManager(services, {
      coreEnvironment: { logLevel: "debug", port: "1234" },
    });

    const view = await manager.getSection("general");

    expect(view.lockedFields).toStrictEqual(["logging.logLevel"]);
    expect(view.values).toMatchObject({ logging: { logLevel: "debug" } });
  });

  it("reports stored values that are currently ignored", async ({
    services,
  }) => {
    await services.settingsService.writeValues(FAKE_NAMESPACE, {
      upsert: { n: "not-a-number" },
      delete: [],
    });

    const manager = createManager(services);

    const view = await manager.getSection("fake");

    expect(view.issues).toStrictEqual([
      { leaf: "n", path: "nested.n", message: expect.any(String) },
    ]);
  });
});

describe("updateSection", () => {
  it("deletes a row when the value equals its default", async ({
    services,
  }) => {
    await services.settingsService.writeValues(FAKE_NAMESPACE, {
      upsert: { apiKey: "secret", n: 3 },
      delete: [],
    });

    const manager = createManager(services);

    await expect(
      manager.updateSection("fake", { nested: { n: 1 } }),
    ).resolves.toStrictEqual([]);
    await expect(
      services.settingsService.getStoredValues(FAKE_NAMESPACE),
    ).resolves.toStrictEqual({ apiKey: "secret" });
  });

  it("upserts a value that differs from its default", async ({ services }) => {
    await services.settingsService.writeValues(FAKE_NAMESPACE, {
      upsert: { apiKey: "secret" },
      delete: [],
    });

    const manager = createManager(services);

    await expect(
      manager.updateSection("fake", { nested: { n: 2 } }),
    ).resolves.toStrictEqual([]);
    await expect(
      services.settingsService.getStoredValues(FAKE_NAMESPACE),
    ).resolves.toStrictEqual({ apiKey: "secret", n: 2 });
  });

  it("leaves a stored secret unchanged when submitted empty", async ({
    services,
  }) => {
    await services.settingsService.writeValues(FAKE_NAMESPACE, {
      upsert: { apiKey: "secret" },
      delete: [],
    });

    const manager = createManager(services);

    await expect(
      manager.updateSection("fake", { apiKey: "", nested: { n: 2 } }),
    ).resolves.toStrictEqual([]);
    await expect(
      services.settingsService.getStoredValues(FAKE_NAMESPACE),
    ).resolves.toStrictEqual({ apiKey: "secret", n: 2 });
  });

  it("stores a submitted secret", async ({ services }) => {
    const manager = createManager(services);

    await expect(
      manager.updateSection("fake", { apiKey: "new-secret" }),
    ).resolves.toStrictEqual([]);
    await expect(
      services.settingsService.getStoredValues(FAKE_NAMESPACE),
    ).resolves.toStrictEqual({ apiKey: "new-secret" });
  });

  it("ignores env-locked fields in the payload", async ({ services }) => {
    const manager = createManager(services, {
      fakeEnvironment: { apiKey: "env-secret", n: "5" },
    });

    await expect(
      manager.updateSection("fake", { nested: { n: 2 } }),
    ).resolves.toStrictEqual([]);
    await expect(
      services.settingsService.getStoredValues(FAKE_NAMESPACE),
    ).resolves.toStrictEqual({});
  });

  it("returns issues and writes nothing for an invalid value", async ({
    services,
  }) => {
    await services.settingsService.writeValues(FAKE_NAMESPACE, {
      upsert: { apiKey: "secret" },
      delete: [],
    });

    const manager = createManager(services);

    await expect(
      manager.updateSection("fake", { nested: { n: "nope" } }),
    ).resolves.toStrictEqual([
      { path: "nested.n", message: expect.any(String) },
    ]);
    await expect(
      services.settingsService.getStoredValues(FAKE_NAMESPACE),
    ).resolves.toStrictEqual({ apiKey: "secret" });
    expect(manager.restartRequired).toBe(false);
  });

  it("validates core settings and keeps other core keys", async ({
    services,
  }) => {
    await services.settingsService.writeValues("riven", {
      upsert: { enabledPlugins: ["test"] },
      delete: [],
    });

    const manager = createManager(services);

    await expect(
      manager.updateSection("general", {
        scraping: { maximumFailedAttempts: 11 },
      }),
    ).resolves.toStrictEqual([
      {
        path: "scraping.maximumFailedAttempts",
        message: expect.any(String),
      },
    ]);
    await expect(
      manager.updateSection("general", {
        scraping: { maximumFailedAttempts: 5 },
      }),
    ).resolves.toStrictEqual([]);
    await expect(
      services.settingsService.getStoredValues("riven"),
    ).resolves.toStrictEqual({
      enabledPlugins: ["test"],
      maximumFailedAttempts: 5,
    });
  });
});

describe("updateSection with reset", () => {
  it("removes a stored override for a reset field", async ({ services }) => {
    await services.settingsService.writeValues(CLEAR_NAMESPACE, {
      upsert: { url: "https://a.test", limit: 5, retries: 7 },
      delete: [],
    });

    const manager = createManager(services);

    await expect(
      manager.updateSection("clear", { url: "https://b.test" }, [
        "limit",
        "retries",
      ]),
    ).resolves.toStrictEqual([]);
    await expect(
      services.settingsService.getStoredValues(CLEAR_NAMESPACE),
    ).resolves.toStrictEqual({ url: "https://b.test" });

    const view = await manager.getSection("clear");

    expect(view.values).toStrictEqual({
      url: "https://b.test",
      retries: 3,
      interval: 60,
    });
  });

  it("does not write when resetting a field with no stored row", async ({
    services,
  }) => {
    await services.settingsService.writeValues(CLEAR_NAMESPACE, {
      upsert: { url: "https://a.test" },
      delete: [],
    });

    const manager = createManager(services);

    await expect(
      manager.updateSection("clear", {}, ["limit"]),
    ).resolves.toStrictEqual([]);
    await expect(
      services.settingsService.getStoredValues(CLEAR_NAMESPACE),
    ).resolves.toStrictEqual({ url: "https://a.test" });
    expect(manager.restartRequired).toBe(false);
  });

  it("validates reset fields together with the submitted values", async ({
    services,
  }) => {
    await services.settingsService.writeValues(CLEAR_NAMESPACE, {
      upsert: { url: "https://a.test", limit: 5 },
      delete: [],
    });

    const manager = createManager(services);

    await expect(
      manager.updateSection("clear", { retries: 4 }, ["url", "limit"]),
    ).resolves.toStrictEqual([{ path: "url", message: expect.any(String) }]);
    await expect(
      services.settingsService.getStoredValues(CLEAR_NAMESPACE),
    ).resolves.toStrictEqual({ url: "https://a.test", limit: 5 });
    expect(manager.restartRequired).toBe(false);
  });

  it("returns an issue for an unknown reset path", async ({ services }) => {
    await services.settingsService.writeValues(CLEAR_NAMESPACE, {
      upsert: { url: "https://a.test" },
      delete: [],
    });

    const manager = createManager(services);

    await expect(
      manager.updateSection("clear", { retries: 4 }, ["nope"]),
    ).resolves.toStrictEqual([
      { path: "nope", message: 'Unknown setting "nope"' },
    ]);
    await expect(
      services.settingsService.getStoredValues(CLEAR_NAMESPACE),
    ).resolves.toStrictEqual({ url: "https://a.test" });
  });

  it("returns an issue for a path that is both submitted and reset", async ({
    services,
  }) => {
    await services.settingsService.writeValues(FAKE_NAMESPACE, {
      upsert: { apiKey: "secret", n: 3 },
      delete: [],
    });

    const manager = createManager(services);

    await expect(
      manager.updateSection("fake", { nested: { n: 4 } }, ["nested.n"]),
    ).resolves.toStrictEqual([
      { path: "nested.n", message: expect.any(String) },
    ]);
    await expect(
      services.settingsService.getStoredValues(FAKE_NAMESPACE),
    ).resolves.toStrictEqual({ apiKey: "secret", n: 3 });
    expect(manager.restartRequired).toBe(false);
  });

  it("ignores env-locked reset fields", async ({ services }) => {
    await services.settingsService.writeValues(CLEAR_NAMESPACE, {
      upsert: { url: "https://a.test", limit: 5 },
      delete: [],
    });

    const manager = createManager(services, {
      clearEnvironment: { limit: "9" },
    });

    await expect(
      manager.updateSection("clear", {}, ["limit"]),
    ).resolves.toStrictEqual([]);
    await expect(
      services.settingsService.getStoredValues(CLEAR_NAMESPACE),
    ).resolves.toStrictEqual({ url: "https://a.test", limit: 5 });
    expect(manager.restartRequired).toBe(false);
  });

  it("stores an explicit null for a nullable field and reads it back", async ({
    services,
  }) => {
    await services.settingsService.writeValues(CLEAR_NAMESPACE, {
      upsert: { url: "https://a.test" },
      delete: [],
    });

    const manager = createManager(services);

    await expect(
      manager.updateSection("clear", { interval: null }),
    ).resolves.toStrictEqual([]);
    await expect(
      services.settingsService.getStoredValues(CLEAR_NAMESPACE),
    ).resolves.toStrictEqual({ url: "https://a.test", interval: null });

    const view = await manager.getSection("clear");

    expect(view.values).toMatchObject({ interval: null });
    expect(view.issues).toStrictEqual([]);
  });
});

describe("resetFields", () => {
  it("deletes the row and restores the default state", async ({ services }) => {
    await services.settingsService.writeValues(FAKE_NAMESPACE, {
      upsert: { apiKey: "secret", token: "custom-token" },
      delete: [],
    });

    const manager = createManager(services);

    await expect(manager.resetFields("fake", ["token"])).resolves.toStrictEqual(
      [],
    );
    await expect(
      services.settingsService.getStoredValues(FAKE_NAMESPACE),
    ).resolves.toStrictEqual({ apiKey: "secret" });

    const view = await manager.getSection("fake");

    expect(view.secretStates).toContainEqual({
      path: "token",
      state: "default",
    });
  });

  it("resets a field by its nested path", async ({ services }) => {
    await services.settingsService.writeValues(FAKE_NAMESPACE, {
      upsert: { apiKey: "secret", n: 3 },
      delete: [],
    });

    const manager = createManager(services);

    await expect(
      manager.resetFields("fake", ["nested.n"]),
    ).resolves.toStrictEqual([]);
    await expect(
      services.settingsService.getStoredValues(FAKE_NAMESPACE),
    ).resolves.toStrictEqual({ apiKey: "secret" });
  });

  it("refuses to reset a required field without a default", async ({
    services,
  }) => {
    await services.settingsService.writeValues(FAKE_NAMESPACE, {
      upsert: { apiKey: "secret" },
      delete: [],
    });

    const manager = createManager(services);

    await expect(
      manager.resetFields("fake", ["apiKey"]),
    ).resolves.toStrictEqual([{ path: "apiKey", message: expect.any(String) }]);
    await expect(
      services.settingsService.getStoredValues(FAKE_NAMESPACE),
    ).resolves.toStrictEqual({ apiKey: "secret" });
  });

  it("returns an issue for an unknown path", async ({ services }) => {
    const manager = createManager(services);

    await expect(manager.resetFields("fake", ["nope"])).resolves.toStrictEqual([
      { path: "nope", message: expect.any(String) },
    ]);
  });
});

describe("restartRequired", () => {
  it("is false initially and true after a reset-only mutation", async ({
    services,
  }) => {
    await services.settingsService.writeValues(FAKE_NAMESPACE, {
      upsert: { apiKey: "secret", token: "custom-token" },
      delete: [],
    });

    const manager = createManager(services);

    expect(manager.restartRequired).toBe(false);

    await manager.resetFields("fake", ["token"]);

    expect(manager.restartRequired).toBe(true);
  });
});

describe("setPluginEnabled", () => {
  it("returns an issue for a required secret when enabling", async ({
    services,
  }) => {
    const manager = createManager(services);

    await expect(
      manager.setPluginEnabled("repo-plugin-plex", true),
    ).resolves.toContainEqual({
      path: "plexToken",
      message: expect.any(String),
    });
    await expect(
      services.settingsService.getStoredValues("riven"),
    ).resolves.toStrictEqual({});
    expect(manager.restartRequired).toBe(false);
  });

  it("refuses to change an always-enabled plugin", async ({ services }) => {
    const manager = createManager(services);

    await expect(
      manager.setPluginEnabled("repo-plugin-tmdb", false),
    ).resolves.toStrictEqual([
      { path: "enabled", message: expect.any(String) },
    ]);
  });

  it("refuses to change plugins when enabledPlugins is set by env", async ({
    services,
  }) => {
    const manager = createManager(services, {
      coreEnvironment: { enabledPlugins: '["test"]' },
    });

    await expect(
      manager.setPluginEnabled("repo-plugin-comet", true),
    ).resolves.toStrictEqual([
      { path: "enabled", message: expect.any(String) },
    ]);
  });

  it("stores the core plugin name when enabling", async ({ services }) => {
    const manager = createManager(services);

    await expect(
      manager.setPluginEnabled("repo-plugin-test", true),
    ).resolves.toStrictEqual([]);

    await expect(
      services.settingsService.getStoredValues("riven"),
    ).resolves.toStrictEqual({ enabledPlugins: ["test"] });
    expect(manager.restartRequired).toBe(true);
  });

  it("enables a plugin once its required settings are stored", async ({
    services,
  }) => {
    await services.settingsService.writeValues("@repo/plugin-plex", {
      upsert: { plexToken: "token", plexServerUrl: "http://localhost:32400" },
      delete: [],
    });

    await services.settingsService.writeValues("riven", {
      upsert: { enabledPlugins: ["test"] },
      delete: [],
    });

    const manager = createManager(services);

    await expect(
      manager.setPluginEnabled("repo-plugin-plex", true),
    ).resolves.toStrictEqual([]);

    await expect(
      services.settingsService.getStoredValues("riven"),
    ).resolves.toStrictEqual({ enabledPlugins: ["test", "plex"] });
  });

  it("deletes the row when disabling the last plugin", async ({ services }) => {
    await services.settingsService.writeValues("riven", {
      upsert: { enabledPlugins: ["test"] },
      delete: [],
    });

    const manager = createManager(services);

    await expect(
      manager.setPluginEnabled("repo-plugin-test", false),
    ).resolves.toStrictEqual([]);

    await expect(
      services.settingsService.getStoredValues("riven"),
    ).resolves.toStrictEqual({});
  });

  it.for([true, false])(
    "writes nothing when the plugin is already in the requested state (enabled: %s)",
    async (enabled, { services }) => {
      await services.settingsService.writeValues("riven", {
        upsert: { enabledPlugins: enabled ? ["test"] : [] },
        delete: [],
      });

      const manager = createManager(services);
      const writeValues = vi.spyOn(services.settingsService, "writeValues");

      await expect(
        manager.setPluginEnabled("repo-plugin-test", enabled),
      ).resolves.toStrictEqual([]);

      expect(writeValues).not.toHaveBeenCalled();
      expect(manager.restartRequired).toBe(false);
    },
  );

  it("throws NOT_FOUND for an unknown plugin", async ({ services }) => {
    const manager = createManager(services);

    await expect(
      manager.setPluginEnabled("repo-plugin-nope", true),
    ).rejects.toBeInstanceOf(GraphQLError);
  });
});

describe("listPlugins", () => {
  it("lists installed plugins with their current enabled state", async ({
    services,
  }) => {
    await services.settingsService.writeValues("riven", {
      upsert: { enabledPlugins: ["test"] },
      delete: [],
    });

    const manager = createManager(services);

    await expect(manager.listPlugins()).resolves.toStrictEqual({
      plugins: [
        {
          id: "repo-plugin-comet",
          title: "Comet",
          enabled: false,
          alwaysEnabled: false,
        },
        {
          id: "repo-plugin-plex",
          title: "Plex",
          enabled: false,
          alwaysEnabled: false,
        },
        {
          id: "repo-plugin-test",
          title: "@repo/plugin-test",
          enabled: true,
          alwaysEnabled: false,
        },
        {
          id: "repo-plugin-tmdb",
          title: "TMDB",
          enabled: true,
          alwaysEnabled: true,
        },
      ],
      enabledPluginsLocked: false,
    });
  });

  it("reports enabledPlugins as locked when set by env", async ({
    services,
  }) => {
    const manager = createManager(services, {
      coreEnvironment: { enabledPlugins: '["test"]' },
    });

    const { plugins, enabledPluginsLocked } = await manager.listPlugins();

    expect(enabledPluginsLocked).toBe(true);
    expect(plugins.find(({ id }) => id === "repo-plugin-test")).toMatchObject({
      enabled: true,
    });
  });
});

describe("plugin env settings", () => {
  it("resolves notifications urls from env and locks the field", async ({
    services,
  }) => {
    const packageName = "@repo/plugin-notifications";
    const prefix = constantCase(packageName);
    const environment = {
      [`RIVEN_PLUGIN_SETTING__${prefix}__urls`]: '["discord://id/token"]',
    };

    const pluginSettings = new PluginSettings(
      environment,
      [prefix],
      createLogger({ silent: true }),
      false,
    );

    const pluginEnvironment = new Map([
      [packageName, pluginSettings.getEnvironmentSnapshot().get(prefix) ?? {}],
    ]);

    const resolved = resolveSettings({
      schema: notificationsPlugin.settingsSchema,
      stored: {},
      env: { ...pluginSettings.getEnvironmentSnapshot().get(prefix) },
    });

    pluginSettings.set(
      prefix,
      notificationsPlugin.settingsSchema,
      resolved.value,
      getLeafPaths(notificationsPlugin.settingsSchema).keys(),
    );

    expect(resolved.value).toStrictEqual({ urls: ["discord://id/token"] });
    expect(resolved.lockedLeaves).toStrictEqual(new Set(["urls"]));

    const notificationsInstall: InstalledPlugin = {
      sectionId: "repo-plugin-notifications",
      packageName,
      name: "notifications",
      plugin: notificationsPlugin,
      enabled: true,
      alwaysEnabled: false,
    };

    const manager = new SettingsManager({
      settingsService: services.settingsService,
      sections: buildSettingsSections({
        installedPlugins: [notificationsInstall],
        pluginEnvironment,
        coreEnvironment: {},
      }),
      installedPlugins: [notificationsInstall],
      coreEnvironment: {},
    });

    const view = await manager.getSection("repo-plugin-notifications");

    expect(view.lockedFields).toStrictEqual(["urls"]);
    expect(view.values).toStrictEqual({ urls: ["discord://id/token"] });
    expect(view.issues).toStrictEqual([]);
  });
});
