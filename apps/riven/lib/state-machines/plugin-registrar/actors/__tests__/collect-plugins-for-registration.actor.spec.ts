import { RivenPluginPackage } from "@repo/util-plugin-sdk";
import { PluginSettings } from "@repo/util-plugin-sdk/utilities/plugin-settings";

import { expect, vi } from "vitest";
import { createActor, toPromise } from "xstate";
import z from "zod";

import { it } from "#__tests__/test-context.ts";
import { logger } from "#utilities/logger/logger.ts";
import {
  getRuntimeSettings,
  initialiseRuntimeSettings,
} from "#utilities/runtime-settings.ts";

import { collectPluginsForRegistration } from "../collect-plugins-for-registration.actor.ts";

import type { RuntimeSettings } from "#settings/core-settings-sections.ts";
import type { InstalledPlugin } from "#types/plugins.ts";
import type { ParsedPlugins } from "../collect-plugins-for-registration.actor.ts";

it("returns the installed plugins from the package.json file", async ({
  services,
}) => {
  const actor = createActor(collectPluginsForRegistration, {
    input: { settingsService: services.settingsService },
  });
  const testPlugin = await import("@repo/plugin-test");

  const { plugin: validatedPlugin } = RivenPluginPackage.parse(testPlugin);

  const plugins = await toPromise(actor.start());

  expect(plugins.validPlugins[0]?.name).toStrictEqual(validatedPlugin.name);
  expect(plugins.installedPlugins).toStrictEqual([
    expect.objectContaining<Partial<InstalledPlugin>>({
      sectionId: "repo-plugin-test",
      packageName: "@repo/plugin-test",
      name: "test" as never,
      enabled: true,
      alwaysEnabled: false,
    }),
  ]);
});

it("lists disabled plugins as installed without registering them", async ({
  services,
}) => {
  const runtimeSettings = structuredClone(
    getRuntimeSettings(),
  ) as RuntimeSettings;

  initialiseRuntimeSettings({
    ...runtimeSettings,
    plugins: { enabledPlugins: [] },
  });

  const actor = createActor(collectPluginsForRegistration, {
    input: { settingsService: services.settingsService },
  });

  const plugins = await toPromise(actor.start());

  expect(plugins.validPlugins).toStrictEqual([]);
  expect(plugins.pluginConfigPrefixMap.size).toBe(0);
  expect(plugins.installedPlugins).toStrictEqual([
    expect.objectContaining<Partial<InstalledPlugin>>({
      sectionId: "repo-plugin-test",
      packageName: "@repo/plugin-test",
      enabled: false,
      alwaysEnabled: false,
    }),
  ]);
});

it("returns the stored settings for every installed plugin", async ({
  services,
}) => {
  await services.settingsService.writeValues("@repo/plugin-test", {
    upsert: { url: "https://stored.example.com" },
    delete: [],
  });

  const actor = createActor(collectPluginsForRegistration, {
    input: { settingsService: services.settingsService },
  });

  const plugins = await toPromise(actor.start());

  expect(plugins.storedPluginSettings).toStrictEqual(
    new Map([["@repo/plugin-test", { url: "https://stored.example.com" }]]),
  );
});

it("removes the plugin settings from process.env before the plugin module is imported", async ({
  services,
}) => {
  const environmentKey = "RIVEN_PLUGIN_SETTING__REPO_PLUGIN_TEST__url";

  process.env[environmentKey] = "https://env.example.com";

  let environmentValueAtImport: string | undefined = "not imported";

  vi.doMock(import("@repo/plugin-test"), async (importOriginal) => {
    environmentValueAtImport = process.env[environmentKey];

    return importOriginal();
  });

  const actor = createActor(collectPluginsForRegistration, {
    input: { settingsService: services.settingsService },
  });

  const plugins = await toPromise(actor.start());

  expect(environmentValueAtImport).toBeUndefined();
  expect(process.env[environmentKey]).toBeUndefined();
  expect(plugins.pluginEnvironment).toStrictEqual(
    new Map([["@repo/plugin-test", { url: "https://env.example.com" }]]),
  );
});

it("returns any invalid plugins from the package.json file along with their validation result", async ({
  annotate,
  services,
}) => {
  await annotate(
    "This test requires a plugin that does not conform to the Riven plugin interface.",
  );

  const actor = createActor(collectPluginsForRegistration, {
    input: { settingsService: services.settingsService },
  });

  vi.doMock(
    import("@repo/plugin-test"),
    () =>
      ({
        plugin: {
          name: "Test",
        },
      }) as never,
  );

  const validationResult = RivenPluginPackage.safeParse(
    await import("@repo/plugin-test"),
  );

  const plugins = await toPromise(actor.start());

  expect.assert(validationResult.error);

  expect(plugins).toStrictEqual<ParsedPlugins>({
    invalidPlugins: new Map([
      ["@repo/plugin-test", z.prettifyError(validationResult.error)],
    ]),
    unresolvablePlugins: [],
    validPlugins: [],
    installedPlugins: [],
    pluginConfigPrefixMap: new Map(),
    pluginEnvironment: new Map([["@repo/plugin-test", {}]]),
    pluginSettings: new PluginSettings({}, ["REPO_PLUGIN_TEST"], logger, false),
    storedPluginSettings: new Map(),
  });
});

it("throws if two plugins resolve to the same section id", async ({
  services,
}) => {
  vi.doMock(
    import("#package.json"),
    () =>
      ({
        default: {
          name: "riven",
          version: "1.0.0-mock",
          dependencies: {
            "@repo/plugin-a1": "workspace:^",
            "@repo/plugin-a-1": "workspace:^",
          },
        },
      }) as never,
  );

  const actor = createActor(collectPluginsForRegistration, {
    input: { settingsService: services.settingsService },
  });

  await expect(toPromise(actor.start())).rejects.toThrow(
    'Plugins "@repo/plugin-a1" and "@repo/plugin-a-1" both resolve to the settings section id "repo-plugin-a-1".',
  );
});
