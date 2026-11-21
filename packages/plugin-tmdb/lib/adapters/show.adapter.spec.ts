import { HttpResponse, http } from "msw/http";
import { expect } from "vitest";

import { it } from "../__tests__/tmdb.test-context.ts";
import { TmdbAPI } from "../datasource/tmdb.datasource.ts";
import { createTmdbShow } from "../utilities/create-tmdb-indexer-data.ts";
import { showAdapter } from "./show.adapter.ts";

import type { ShowListItem } from "../schemas/show-list-item.schema.ts";

const TMDB_URL = "https://api.themoviedb.org/3";

const createShow = (imdbId?: string | null) =>
  createTmdbShow({
    tmdbId: "1396",
    tvdbId: "81189",
    ...(imdbId === undefined ? {} : { imdbId }),
    title: "Breaking Bad",
    overview: "",
    genres: [],
    rawRuntime: null,
    status: "unknown",
  });

const showListItem = (id: number, name: string): ShowListItem => ({
  id,
  name,
  overview: "",
  backdrop_path: "/backdrop.jpg",
  poster_path: "/poster.jpg",
  original_language: "en",
  genre_ids: [],
});

const pagedResponse = (results: ShowListItem[]) => ({
  page: 1,
  results,
  total_pages: 1,
  total_results: results.length,
});

it.for([
  { locale: "en-GB", expected: "15" },
  { locale: "de-DE", expected: "TV-MA" },
  { locale: "en", expected: "TV-MA" },
])(
  "returns the $locale content rating, falling back to the US rating",
  async ({ locale, expected }, { server, dataSourceMap }) => {
    server.use(
      http.get(`${TMDB_URL}/tv/1396/content_ratings`, () =>
        HttpResponse.json({
          results: [
            { iso_3166_1: "US", rating: "TV-MA" },
            { iso_3166_1: "GB", rating: "15" },
          ],
        }),
      ),
    );

    await expect(
      showAdapter.getCertification(
        dataSourceMap.get(TmdbAPI),
        createShow(),
        locale,
      ),
    ).resolves.toBe(expected);
  },
);

it("returns no content rating when neither the locale nor the US is rated", async ({
  server,
  dataSourceMap,
}) => {
  server.use(
    http.get(`${TMDB_URL}/tv/1396/content_ratings`, () =>
      HttpResponse.json({ results: [{ iso_3166_1: "GB", rating: "15" }] }),
    ),
  );

  await expect(
    showAdapter.getCertification(
      dataSourceMap.get(TmdbAPI),
      createShow(),
      "de-DE",
    ),
  ).resolves.toBeNull();
});

it.for([
  { imdbId: "tt0903747", expected: "tt0903747" },
  { imdbId: null, expected: null },
])(
  "returns the known IMDB ID ($imdbId) without looking it up",
  async ({ imdbId, expected }, { server, dataSourceMap }) => {
    let lookups = 0;

    server.use(
      http.get(`${TMDB_URL}/tv/1396/external_ids`, () => {
        lookups += 1;

        return HttpResponse.json({ imdb_id: "tt9999999" });
      }),
    );

    await expect(
      showAdapter.getImdbId(dataSourceMap.get(TmdbAPI), createShow(imdbId)),
    ).resolves.toBe(expected);
    expect(lookups).toBe(0);
  },
);

it.for([
  { response: { imdb_id: "tt0903747" }, expected: "tt0903747" },
  { response: {}, expected: null },
])(
  "looks up an unknown IMDB ID (found: $expected)",
  async ({ response, expected }, { server, dataSourceMap }) => {
    server.use(
      http.get(`${TMDB_URL}/tv/1396/external_ids`, () =>
        HttpResponse.json(response),
      ),
    );

    await expect(
      showAdapter.getImdbId(dataSourceMap.get(TmdbAPI), createShow()),
    ).resolves.toBe(expected);
  },
);

it.for([
  {
    method: "getRecommendations",
    path: "recommendations",
    sizes: { backdrop: "original", poster: "w185" },
  },
  {
    method: "getSimilarItems",
    path: "similar",
    sizes: { backdrop: "w780", poster: "w185" },
  },
] as const)(
  "maps the $path shows",
  async ({ method, path, sizes }, { server, dataSourceMap }) => {
    server.use(
      http.get(`${TMDB_URL}/tv/1396/${path}`, () =>
        HttpResponse.json(pagedResponse([showListItem(1, "Better Call Saul")])),
      ),
      http.get(`${TMDB_URL}/tv/1/external_ids`, () =>
        HttpResponse.json({ imdb_id: "tt3032476", tvdb_id: 273_181 }),
      ),
    );

    const shows = await showAdapter[method](
      dataSourceMap.get(TmdbAPI),
      createShow(),
    );

    expect(shows).toMatchObject([
      {
        id: "273181",
        tmdbId: "1",
        imdbId: "tt3032476",
        title: "Better Call Saul",
        backdropUrl: `https://image.tmdb.org/t/p/${sizes.backdrop}/backdrop.jpg`,
        posterUrl: `https://image.tmdb.org/t/p/${sizes.poster}/poster.jpg`,
      },
    ]);
  },
);

it.for([
  { method: "getRecommendations", path: "recommendations" },
  { method: "getSimilarItems", path: "similar" },
] as const)(
  "returns no $path shows when TMDB has none",
  async ({ method, path }, { server, dataSourceMap }) => {
    server.use(
      http.get(`${TMDB_URL}/tv/1396/${path}`, () =>
        HttpResponse.json(pagedResponse([])),
      ),
    );

    await expect(
      showAdapter[method](dataSourceMap.get(TmdbAPI), createShow()),
    ).resolves.toBeNull();
  },
);

it("returns each cast member's most prominent role", async ({
  server,
  dataSourceMap,
}) => {
  server.use(
    http.get(`${TMDB_URL}/tv/1396/aggregate_credits`, () =>
      HttpResponse.json({
        id: 1396,
        cast: [
          {
            id: 17_419,
            name: "Bryan Cranston",
            profile_path: "/profile.jpg",
            total_episode_count: 62,
            order: 0,
            roles: [
              { character: "Heisenberg", episode_count: 10 },
              { character: "Walter White", episode_count: 62 },
            ],
          },
          {
            id: 1,
            name: "Uncredited",
            profile_path: null,
            total_episode_count: 0,
            order: 1,
            roles: [],
          },
        ],
      }),
    ),
  );

  await expect(
    showAdapter.getCast(dataSourceMap.get(TmdbAPI), createShow(), "en-US"),
  ).resolves.toStrictEqual([
    {
      id: "17419",
      name: "Bryan Cranston",
      character: "Walter White",
      profileUrl: "https://image.tmdb.org/t/p/w185/profile.jpg",
    },
    { id: "1", name: "Uncredited", character: "", profileUrl: null },
  ]);
});

it("returns no cast when TMDB has none", async ({ server, dataSourceMap }) => {
  server.use(
    http.get(`${TMDB_URL}/tv/1396/aggregate_credits`, () =>
      HttpResponse.json({ id: 1396, cast: [] }),
    ),
  );

  await expect(
    showAdapter.getCast(dataSourceMap.get(TmdbAPI), createShow(), "en-US"),
  ).resolves.toBeNull();
});
