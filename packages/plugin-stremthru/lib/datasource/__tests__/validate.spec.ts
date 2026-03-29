import { it } from "@repo/util-plugin-testing/plugin-test-context";

import { HttpResponse, http } from "msw";
import { expect } from "vitest";

import plugin from "../../index.ts";
import { pluginConfig } from "../../stremthru-plugin.config.ts";
import { StremThruAPI } from "../stremthru.datasource.ts";

it.override("plugin", plugin);

it("returns false if the request fails", async ({
  server,
  dataSourceConfig,
}) => {
  server.use(
    http.get("**/v0/torznab/api", () =>
      HttpResponse.json({ success: false }, { status: 401 }),
    ),
  );

  const stremThruApi = new StremThruAPI({
    ...dataSourceConfig,
    pluginSymbol: pluginConfig.name,
    settings: {
      stremThruUrl: "https://stremthru.13377001.xyz/",
      realdebridApiKey: "1234",
    },
  });

  const isValid = await stremThruApi.validate();

  expect(isValid).toBe(false);
});

it("returns true if the request succeeds", async ({
  server,
  dataSourceConfig,
}) => {
  server.use(
    http.get("**/v0/torznab/api", () => HttpResponse.json({ success: true })),
  );

  const stremThruApi = new StremThruAPI({
    ...dataSourceConfig,
    pluginSymbol: pluginConfig.name,
    settings: {
      stremThruUrl: "https://stremthru.13377001.xyz/",
      realdebridApiKey: "1234",
    },
  });

  const isValid = await stremThruApi.validate();

  expect(isValid).toBe(true);
});
