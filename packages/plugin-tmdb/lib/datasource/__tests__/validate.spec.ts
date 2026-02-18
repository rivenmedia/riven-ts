import { it } from "@repo/util-plugin-testing/plugin-test-context";

import { HttpResponse, http } from "msw";
import { expect } from "vitest";

import { TmdbAPI } from "../tmdb.datasource.ts";

it("returns false if the request fails", async ({
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
    pluginSymbol: Symbol("@repo/plugin-tmdb"),
    settings: {
      apiKey: "",
    },
  });
  const isValid = await tmdbApi.validate();

  expect(isValid).toBe(false);
});

it("returns true if the request succeeds", async ({
  server,
  dataSourceConfig,
}) => {
  server.use(
    http.get("**/validate", () => HttpResponse.json({ success: true })),
  );

  const tmdbApi = new TmdbAPI({
    ...dataSourceConfig,
    pluginSymbol: Symbol("@repo/plugin-tmdb"),
    settings: {
      apiKey: "",
    },
  });
  const isValid = await tmdbApi.validate();

  expect(isValid).toBe(true);
});
