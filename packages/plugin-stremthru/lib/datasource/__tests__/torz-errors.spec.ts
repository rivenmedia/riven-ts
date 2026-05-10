import { createMockPluginSettings } from "@repo/util-plugin-testing/create-mock-plugin-settings";
import { it as pluginTestContext } from "@repo/util-plugin-testing/plugin-test-context";

import { HttpResponse, http } from "msw";
import { expect } from "vitest";

import plugin from "../../index.ts";
import { StremThruSettings } from "../../stremthru-settings.schema.ts";
import { StremThruTorzAPI } from "../stremthru-torz.datasource.ts";

const it: typeof pluginTestContext = pluginTestContext
  .override("plugin", plugin)
  .override(
    "settings",
    createMockPluginSettings(StremThruSettings, {
      realdebridApiKey: "test-rd-key",
    }),
  );

it("throws when store header is invalid", async ({ dataSourceMap }) => {
  const api = dataSourceMap.get(StremThruTorzAPI);

  await expect(
    api.addTorrent("abc123", "invalid-store" as never),
  ).rejects.toThrow("Store is required");
});

it("throws when API key is missing for the store", async ({
  dataSourceMap,
}) => {
  const api = dataSourceMap.get(StremThruTorzAPI);

  await expect(api.addTorrent("abc123", "torbox")).rejects.toThrow(
    "Missing API key for torbox",
  );
});
