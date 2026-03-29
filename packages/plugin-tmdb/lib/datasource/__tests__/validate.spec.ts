import { it } from "@repo/util-plugin-testing/plugin-test-context";

import { HttpResponse, http } from "msw";
import { expect } from "vitest";

import { pluginConfig } from "../../tmdb-plugin.config.ts";
import { TmdbAPI } from "../tmdb.datasource.ts";

it.skip("returns false if the request fails", ({
  server,
  dataSourceConfig,
}) => {
  server.use(
    http.get("**/validate", () =>
      HttpResponse.json({ success: false }, { status: 401 }),
    ),
  );

  const tmdbApi = new TmdbAPI({
    ...dataSourceConfig,
    pluginSymbol: pluginConfig.name,
    settings: {
      apiKey: "",
    },
  });

  const isValid = tmdbApi.validate();

  expect(isValid).toBe(false);
});

it("returns true if the request succeeds", ({ server, dataSourceConfig }) => {
  server.use(
    http.get("**/validate", () => HttpResponse.json({ success: true })),
  );

  const tmdbApi = new TmdbAPI({
    ...dataSourceConfig,
    pluginSymbol: pluginConfig.name,
    settings: {
      apiKey: "",
    },
  });

  const isValid = tmdbApi.validate();

  expect(isValid).toBe(true);
});
