import { HttpResponse, http } from "msw";
import assert from "node:assert";
import { expect } from "vitest";

import { it } from "../../__tests__/tmdb.test-context.ts";

import type { IndexerData } from "@repo/util-plugin-sdk/dto/types/indexer-data.type";

const findHandler = http.get("**/find/81189", ({ request }) => {
  if (new URL(request.url).searchParams.get("external_source") !== "tvdb_id") {
    return HttpResponse.json(null, { status: 400 });
  }

  return HttpResponse.json({ tv_results: [{ id: 1396 }] });
});

const detailsHandler = http.get("**/tv/1396", () =>
  HttpResponse.json({
    id: 1396,
    name: "Breaking Bad",
    overview: "A chemistry teacher turned drug manufacturer.",
    backdrop_path: "/backdrop.jpg",
    poster_path: "/poster.jpg",
    original_language: "en",
    first_air_date: "2008-01-20",
    episode_run_time: [],
    last_episode_to_air: { runtime: 56 },
    genres: [{ id: 18, name: "Drama" }],
    homepage: "",
    status: "Ended",
    origin_country: ["US"],
    production_companies: [
      {
        id: 11_073,
        name: "Sony Pictures Television",
        logo_path: null,
        origin_country: "US",
      },
    ],
    spoken_languages: [
      { english_name: "English", iso_639_1: "en", name: "English" },
    ],
    external_ids: { imdb_id: "tt0903747", tvdb_id: 81_189 },
  }),
);

it("looks up a show by its TVDB ID", async ({
  gqlContext,
  gqlServer,
  server,
}) => {
  server.use(findHandler, detailsHandler);

  const { body } = await gqlServer.executeOperation<{
    tmdbItem: IndexerData;
  }>(
    {
      query: `
        query TmdbShow {
          tmdbItem(id: "81189", type: show) {
            __typename
            id
            type
            isRequestable
            title
            year
            runtime
            status
            homepage
            imdbId
            genres {
              name
            }
            ... on TmdbIndexerData {
              tmdbId
              tvdbId
            }
          }
        }
      `,
    },
    { contextValue: gqlContext },
  );

  assert.ok(body.kind === "single");

  expect(body.singleResult.errors).toBeUndefined();
  expect(structuredClone(body.singleResult.data?.tmdbItem)).toStrictEqual({
    __typename: "TmdbIndexerData",
    id: "81189",
    type: "show",
    isRequestable: true,
    title: "Breaking Bad",
    year: 2008,
    runtime: "56 minutes",
    status: "released",
    homepage: null,
    imdbId: "tt0903747",
    genres: [{ name: "Drama" }],
    tmdbId: "1396",
    tvdbId: "81189",
  });
});

it("returns an error if TMDB has no show for the TVDB ID", async ({
  gqlContext,
  gqlServer,
  server,
}) => {
  server.use(
    http.get("**/find/1", () => HttpResponse.json({ tv_results: [] })),
  );

  const { body } = await gqlServer.executeOperation(
    {
      query: `
        query TmdbShow {
          tmdbItem(id: "1", type: show) {
            id
          }
        }
      `,
    },
    { contextValue: gqlContext },
  );

  assert.ok(body.kind === "single");

  expect(body.singleResult.errors?.[0]?.message).toBe(
    "No TMDB show found for TVDB ID 1",
  );
});

it("returns the show's aggregate cast with each actor's main role", async ({
  gqlContext,
  gqlServer,
  server,
}) => {
  server.use(
    findHandler,
    detailsHandler,
    http.get("**/tv/1396/aggregate_credits", () =>
      HttpResponse.json({
        id: 1396,
        cast: [
          {
            id: 17_419,
            name: "Bryan Cranston",
            profile_path: "/cranston.jpg",
            total_episode_count: 62,
            order: 0,
            roles: [
              { character: "Heisenberg", episode_count: 1 },
              { character: "Walter White", episode_count: 62 },
            ],
          },
        ],
      }),
    ),
  );

  const { body } = await gqlServer.executeOperation<{
    tmdbItem: Pick<IndexerData, "cast">;
  }>(
    {
      query: `
        query TmdbShowCast {
          tmdbItem(id: "81189", type: show) {
            cast {
              id
              name
              character
              profileUrl
            }
          }
        }
      `,
    },
    { contextValue: gqlContext },
  );

  assert.ok(body.kind === "single");

  expect(body.singleResult.errors).toBeUndefined();
  expect(structuredClone(body.singleResult.data?.tmdbItem.cast)).toStrictEqual([
    {
      id: "17419",
      name: "Bryan Cranston",
      character: "Walter White",
      profileUrl: "https://image.tmdb.org/t/p/w185/cranston.jpg",
    },
  ]);
});

it("returns show recommendations keyed by TVDB ID, keeping shows without a TVDB ID as unrequestable", async ({
  gqlContext,
  gqlServer,
  server,
}) => {
  server.use(
    findHandler,
    detailsHandler,
    http.get("**/tv/1396/recommendations", () =>
      HttpResponse.json({
        page: 1,
        total_pages: 1,
        total_results: 2,
        results: [
          {
            id: 60_059,
            name: "Better Call Saul",
            overview: "Six years before Saul Goodman meets Walter White.",
            backdrop_path: null,
            poster_path: "/saul.jpg",
            original_language: "en",
            genre_ids: [80, 18],
            first_air_date: "2015-02-08",
            origin_country: ["US"],
          },
          {
            id: 999,
            name: "Obscure Show",
            overview: "Not on TVDB.",
            backdrop_path: null,
            poster_path: null,
            original_language: "en",
            genre_ids: [],
            first_air_date: "",
            origin_country: [],
          },
        ],
      }),
    ),
    http.get("**/tv/60059/external_ids", () =>
      HttpResponse.json({ imdb_id: "tt3032476", tvdb_id: 273_181 }),
    ),
    http.get("**/tv/999/external_ids", () =>
      HttpResponse.json({ imdb_id: null, tvdb_id: null }),
    ),
  );

  const { body } = await gqlServer.executeOperation<{
    tmdbItem: Pick<IndexerData, "recommendations">;
  }>(
    {
      query: `
        query TmdbShowRecommendations {
          tmdbItem(id: "81189", type: show) {
            recommendations {
              id
              type
              title
              year
              isRequestable
            }
          }
        }
      `,
    },
    { contextValue: gqlContext },
  );

  assert.ok(body.kind === "single");

  expect(body.singleResult.errors).toBeUndefined();
  expect(
    structuredClone(body.singleResult.data?.tmdbItem.recommendations),
  ).toStrictEqual([
    {
      id: "273181",
      type: "show",
      title: "Better Call Saul",
      year: 2015,
      isRequestable: true,
    },
    {
      id: "tmdb-999",
      type: "show",
      title: "Obscure Show",
      year: null,
      isRequestable: false,
    },
  ]);
});

it("returns the content rating for the requested region, falling back to the US", async ({
  gqlContext,
  gqlServer,
  server,
}) => {
  server.use(
    findHandler,
    detailsHandler,
    http.get("**/tv/1396/content_ratings", () =>
      HttpResponse.json({
        results: [
          { iso_3166_1: "GB", rating: "18" },
          { iso_3166_1: "US", rating: "TV-MA" },
        ],
      }),
    ),
  );

  const { body } = await gqlServer.executeOperation<{
    gb: Pick<IndexerData, "certification">;
    fr: Pick<IndexerData, "certification">;
  }>(
    {
      query: `
        query TmdbShowCertification {
          gb: tmdbItem(id: "81189", type: show) {
            certification(locale: "en-GB")
          }
          fr: tmdbItem(id: "81189", type: show) {
            certification(locale: "fr-FR")
          }
        }
      `,
    },
    { contextValue: gqlContext },
  );

  assert.ok(body.kind === "single");

  expect(body.singleResult.errors).toBeUndefined();
  expect(body.singleResult.data?.gb.certification).toBe("18");
  expect(body.singleResult.data?.fr.certification).toBe("TV-MA");
});
