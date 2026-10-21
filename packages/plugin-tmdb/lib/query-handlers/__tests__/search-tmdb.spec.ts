import { HttpResponse, http } from "msw";
import { expect } from "vitest";

import { it } from "../../__tests__/tmdb.test-context.ts";
import { searchTmdb } from "../search-tmdb.ts";

const createMovie = (id: number, title: string) => ({
  media_type: "movie",
  id,
  title,
  overview: `${title} overview`,
  backdrop_path: "/backdrop.jpg",
  poster_path: "/poster.jpg",
  original_language: "en",
  genre_ids: [28],
  release_date: "2024-01-01",
});

const createShow = (id: number, name: string) => ({
  media_type: "tv",
  id,
  name,
  overview: `${name} overview`,
  backdrop_path: "/backdrop.jpg",
  poster_path: "/poster.jpg",
  original_language: "en",
  genre_ids: [18],
  first_air_date: "2024-01-01",
  origin_country: ["US"],
});

const createPerson = (id: number) => ({
  media_type: "person",
  id,
  name: "Some Person",
});

const searchResponse = (results: unknown[]) =>
  HttpResponse.json({
    page: 1,
    total_pages: 1,
    total_results: results.length,
    results,
  });

it("maps movies and shows in TMDB's relevance order, skipping people", async ({
  server,
  dataSourceMap,
  logger,
}) => {
  server.use(
    http.get("**/search/multi", () =>
      searchResponse([
        createShow(1, "Test Show"),
        createPerson(2),
        createMovie(3, "Test Movie"),
      ]),
    ),
    http.get("**/tv/1/external_ids", () =>
      HttpResponse.json({ imdb_id: "tt1", tvdb_id: 100 }),
    ),
  );

  const results = await searchTmdb.handler({
    args: { query: "test", page: 1, type: null },
    dataSources: dataSourceMap,
    logger,
  });

  expect(results).toMatchObject([
    {
      id: "100",
      tmdbId: "1",
      tvdbId: "100",
      imdbId: "tt1",
      type: "show",
      title: "Test Show",
      isRequestable: true,
      originCountry: ["US"],
    },
    {
      id: "3",
      tmdbId: "3",
      tvdbId: null,
      type: "movie",
      title: "Test Movie",
      isRequestable: true,
      releaseDate: new Date("2024-01-01T00:00:00.000Z"),
    },
  ]);
});

it("surfaces shows without a TVDB ID as unrequestable", async ({
  server,
  dataSourceMap,
  logger,
}) => {
  server.use(
    http.get("**/search/multi", () =>
      searchResponse([createShow(1, "Not On TVDB")]),
    ),
    http.get("**/tv/1/external_ids", () =>
      HttpResponse.json({ imdb_id: null, tvdb_id: null }),
    ),
  );

  const results = await searchTmdb.handler({
    args: { query: "test", page: 1, type: null },
    dataSources: dataSourceMap,
    logger,
  });

  expect(results).toMatchObject([
    { id: "tmdb-1", tmdbId: "1", tvdbId: null, isRequestable: false },
  ]);
});

it("passes the query and page to TMDB", async ({
  server,
  dataSourceMap,
  logger,
}) => {
  server.use(
    http.get("**/search/multi", ({ request }) => {
      const { searchParams } = new URL(request.url);

      if (
        searchParams.get("query") !== "breaking bad" ||
        searchParams.get("page") !== "2"
      ) {
        return HttpResponse.json(null, { status: 400 });
      }

      return searchResponse([createMovie(1, "Breaking Bad: The Movie")]);
    }),
  );

  const results = await searchTmdb.handler({
    args: { query: "breaking bad", page: 2, type: null },
    dataSources: dataSourceMap,
    logger,
  });

  expect(results).toMatchObject([{ title: "Breaking Bad: The Movie" }]);
});
