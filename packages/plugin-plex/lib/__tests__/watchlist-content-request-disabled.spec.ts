import { createMockPluginSettings } from "@repo/util-plugin-testing/create-mock-plugin-settings";

import { expect } from "vitest";

import { PlexSettings } from "../plex-settings.schema.ts";
import { it } from "./plex.test-context.ts";

it.override("settings", () =>
  createMockPluginSettings(PlexSettings, {
    plexServerUrl: "http://localhost:32400",
    plexToken: "test-plex-token",
    watchlistEnabled: "false",
  }),
);

it("returns an empty response", async ({
  dataSourceMap,
  plugin,
  settings,
  logger,
}) => {
  const providerListRequestedHook =
    plugin.hooks["riven.content-service.requested"];

  expect.assert(providerListRequestedHook);

  const response = await providerListRequestedHook({
    dataSources: dataSourceMap,
    settings,
    event: {},
    logger,
  });

  expect(response).toStrictEqual({
    movies: [],
    shows: [],
    updateIntervalSeconds: null,
  });
});
