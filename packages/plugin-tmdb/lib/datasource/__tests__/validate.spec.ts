import { HttpResponse, http } from "msw";
import { expect } from "vitest";

import { it } from "../../__tests__/tmdb.test-context.ts";
import { TmdbAPI } from "../tmdb.datasource.ts";

it.skip("returns false if the request fails", ({ server, dataSourceMap }) => {
  server.use(
    http.get("**/validate", () =>
      HttpResponse.json({ success: false }, { status: 401 }),
    ),
  );

  const tmdbApi = dataSourceMap.get(TmdbAPI);
  const isValid = tmdbApi.validate();

  expect(isValid).toBe(false);
});

it("returns true if the request succeeds", ({ server, dataSourceMap }) => {
  server.use(
    http.get("**/validate", () => HttpResponse.json({ success: true })),
  );

  const tmdbApi = dataSourceMap.get(TmdbAPI);
  const isValid = tmdbApi.validate();

  expect(isValid).toBe(true);
});
