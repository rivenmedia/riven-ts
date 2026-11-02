import { plugin as cometPlugin } from "@repo/plugin-comet";
import { plugin as plexPlugin } from "@repo/plugin-plex";
import { PluginSettings } from "@repo/util-plugin-sdk/utilities/plugin-settings";

import { expect, vi } from "vitest";
import { createActor, createEmptyActor, fromPromise, toPromise } from "xstate";

import { it } from "#__tests__/test-context.ts";
import { pluginRegistrarMachine } from "#state-machines/plugin-registrar/index.ts";
import { logger } from "#utilities/logger/logger.ts";

import type { SettingsService } from "#database/services/settings/settings.service.ts";
import type { ParsedPlugins } from "#state-machines/plugin-registrar/actors/collect-plugins-for-registration.actor.ts";
import type { InstalledPlugin } from "#types/plugins.ts";

function createParsedPlugins(
  storedPluginSettings: ParsedPlugins["storedPluginSettings"],
): ParsedPlugins {
  const installedPlugins: InstalledPlugin[] = [
    {
      sectionId: "repo-plugin-comet",
      packageName: "@repo/plugin-comet",
      name: "comet",
      plugin: cometPlugin,
      enabled: true,
      alwaysEnabled: false,
    },
    {
      sectionId: "repo-plugin-plex",
      packageName: "@repo/plugin-plex",
      name: "plex",
      plugin: plexPlugin,
      enabled: true,
      alwaysEnabled: false,
    },
  ];

  return {
    validPlugins: [cometPlugin, plexPlugin],
    invalidPlugins: new Map(),
    unresolvablePlugins: [],
    installedPlugins,
    pluginConfigPrefixMap: new Map([
      [cometPlugin.name, "REPO_PLUGIN_COMET"],
      [plexPlugin.name, "REPO_PLUGIN_PLEX"],
    ]),
    pluginEnvironment: new Map([
      ["@repo/plugin-comet", {}],
      ["@repo/plugin-plex", {}],
    ]),
    pluginSettings: new PluginSettings(
      {},
      ["REPO_PLUGIN_COMET", "REPO_PLUGIN_PLEX"],
      logger,
      false,
    ),
    storedPluginSettings,
  };
}

function startRegistrar(
  parsedPlugins: ParsedPlugins,
  settingsService: SettingsService,
) {
  const machine = pluginRegistrarMachine.provide({
    actors: {
      collectPluginsForRegistration: fromPromise(async () =>
        Promise.resolve(parsedPlugins),
      ),
    },
  });

  const actor = createActor(machine, {
    input: { rootRef: createEmptyActor(), settingsService },
  });

  return actor;
}

it("ignores invalid stored plugin settings and registers the plugin with the default value", async ({
  services,
}) => {
  const warnSpy = vi.spyOn(logger, "warn");

  const actor = startRegistrar(
    createParsedPlugins(
      new Map([["@repo/plugin-comet", { url: "not a url" }]]),
    ),
    services.settingsService,
  );

  const output = await toPromise(actor.start());

  expect(output.validPlugins.has(cometPlugin.name)).toBe(true);
  expect(output.pluginSettings.get(cometPlugin.settingsSchema)).toStrictEqual({
    url: "https://comet.feels.legal",
  });
  expect(warnSpy).toHaveBeenCalledWith(
    expect.stringContaining(
      'Ignoring invalid stored setting "url" for plugin @repo/plugin-comet',
    ),
    { namespace: "@repo/plugin-comet", key: "url" },
  );
});

it("skips a plugin whose required settings are missing and continues registering the others", async ({
  services,
}) => {
  const errorSpy = vi.spyOn(logger, "error");

  const actor = startRegistrar(
    createParsedPlugins(new Map()),
    services.settingsService,
  );

  const output = await toPromise(actor.start());

  expect(output.validPlugins.has(plexPlugin.name)).toBe(false);
  expect(output.validPlugins.has(cometPlugin.name)).toBe(true);
  expect(errorSpy).toHaveBeenCalledWith(
    "Invalid settings provided for plugin @repo/plugin-plex",
    expect.anything(),
  );
});

it("outputs the installed plugins and their environment", async ({
  services,
}) => {
  const parsedPlugins = createParsedPlugins(new Map());
  const actor = startRegistrar(parsedPlugins, services.settingsService);

  const output = await toPromise(actor.start());

  expect(output.installedPlugins).toBe(parsedPlugins.installedPlugins);
  expect(output.pluginEnvironment).toBe(parsedPlugins.pluginEnvironment);
});
