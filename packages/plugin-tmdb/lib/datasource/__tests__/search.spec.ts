import { HttpResponse, http } from "msw";
import { expect } from "vitest";

import { it } from "../../__tests__/tmdb.test-context.ts";
import { TmdbAPI } from "../tmdb.datasource.ts";

it("returns parsed search results for movies", async ({
  server,
  dataSourceMap,
}) => {
  server.use(
    http.get("**/search/movie", ({ request }) => {
      const url = new URL(request.url);

      expect(url.searchParams.get("query")).toBe("silo");
      expect(url.searchParams.get("page")).toBe("2");

      return HttpResponse.json({
        page: 2,
        results: [
          {
            id: 95_842,
            title: "Silo",
            overview: "An underground silo",
            release_date: "2023-04-28",
            poster_path: "/silo.jpg",
            original_language: "en",
            vote_average: 8.1,
          },
        ],
        total_pages: 1,
        total_results: 1,
      });
    }),
  );

  const tmdbApi = dataSourceMap.get(TmdbAPI);

  const results = await tmdbApi.searchMovies({ query: "silo", page: 2 });

  expect(results.results).toHaveLength(1);
  expect(results.results?.[0]).toMatchObject({
    id: 95_842,
    title: "Silo",
    release_date: "2023-04-28",
    original_language: "en",
  });
});

it("returns parsed search results for tv shows", async ({
  server,
  dataSourceMap,
}) => {
  server.use(
    http.get("**/search/tv", () =>
      HttpResponse.json({
        page: 1,
        results: [
          {
            id: 130_392,
            name: "The Night Agent",
            first_air_date: "2023-03-23",
            original_language: "en",
            vote_average: 7.8,
            poster_path: null,
          },
        ],
        total_pages: 1,
        total_results: 1,
      }),
    ),
  );

  const tmdbApi = dataSourceMap.get(TmdbAPI);

  const results = await tmdbApi.searchTvShows({ query: "night agent" });

  expect(results.results).toHaveLength(1);
  expect(results.results?.[0]).toMatchObject({
    id: 130_392,
    name: "The Night Agent",
    first_air_date: "2023-03-23",
  });
});
