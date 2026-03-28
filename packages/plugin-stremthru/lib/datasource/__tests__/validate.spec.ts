import { it } from "@repo/util-plugin-testing/plugin-test-context";

import { HttpResponse, http } from "msw";
import { expect } from "vitest";

import plugin from "../../index.ts";
import { StremThruAPI } from "../stremthru.datasource.ts";

it.override("plugin", plugin);

it("returns false if the request fails", async ({
  server,
  dataSourceConfig,
}) => {
  server.use(
    http.get("**/validate", () =>
      HttpResponse.json({ success: false }, { status: 401 }),
    ),
  );

  const stremThruApi = new StremThruAPI({
    ...dataSourceConfig,
    pluginSymbol: Symbol("@repo/plugin-stremthru"),
    settings: {
      stremThruUrl: "https://stremthru.13377001.xyz/",
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
    http.get("**/validate", () => HttpResponse.json({ success: true })),
  );

  const stremThruApi = new StremThruAPI({
    ...dataSourceConfig,
    pluginSymbol: Symbol("@repo/plugin-stremthru"),
    settings: {
      stremThruUrl: "https://stremthru.13377001.xyz/",
    },
  });
  const isValid = await stremThruApi.validate();

  expect(isValid).toBe(true);
});
