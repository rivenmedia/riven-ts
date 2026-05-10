import { HttpResponse, http } from "msw";
import { expect } from "vitest";

import { it } from "../../__tests__/tmdb.test-context.ts";
import { TmdbAPI } from "../tmdb.datasource.ts";

it("returns tmdb id from imdb id", async ({ server, dataSourceMap }) => {
  server.use(
    http.get("**/find/tt1234567", () =>
      HttpResponse.json({
        movie_results: [{ id: 99999 }],
      }),
    ),
  );

  const api = dataSourceMap.get(TmdbAPI);
  const result = await api.getTmdbIdFromImdbId("tt1234567");

  expect(result).toBe(99999);
});

it("returns null when no movie results found", async ({
  server,
  dataSourceMap,
}) => {
  server.use(
    http.get("**/find/tt0000000", () =>
      HttpResponse.json({
        movie_results: [],
      }),
    ),
  );

  const api = dataSourceMap.get(TmdbAPI);
  const result = await api.getTmdbIdFromImdbId("tt0000000");

  expect(result).toBeNull();
});

it("returns null on error", async ({ server, dataSourceMap }) => {
  server.use(
    http.get("**/find/tt9999999", () =>
      HttpResponse.json(null, { status: 500 }),
    ),
  );

  const api = dataSourceMap.get(TmdbAPI);
  const result = await api.getTmdbIdFromImdbId("tt9999999");

  expect(result).toBeNull();
});

it("findById returns find results", async ({ server, dataSourceMap }) => {
  server.use(
    http.get("**/find/tt1111111", () =>
      HttpResponse.json({
        movie_results: [{ id: 12345 }],
        tv_results: [],
      }),
    ),
  );

  const api = dataSourceMap.get(TmdbAPI);
  const result = await api.findById("tt1111111", {
    external_source: "imdb_id",
  });

  expect(result.movie_results![0]!.id).toBe(12345);
});

it("getMovieDetails returns movie with external ids", async ({
  server,
  dataSourceMap,
}) => {
  server.use(
    http.get("**/movie/12345", ({ request }) => {
      const url = new URL(request.url);
      expect(url.searchParams.get("append_to_response")).toBe(
        "external_ids,release_dates",
      );

      return HttpResponse.json({
        id: 12345,
        title: "Test Movie",
        external_ids: { imdb_id: "tt1234567" },
        release_dates: { results: [] },
      });
    }),
  );

  const api = dataSourceMap.get(TmdbAPI);
  const result = await api.getMovieDetails("12345");

  expect(result.id).toBe(12345);
  expect(result.external_ids.imdb_id).toBe("tt1234567");
});
