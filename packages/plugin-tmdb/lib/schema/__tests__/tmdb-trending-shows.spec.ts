import { HttpResponse, http } from "msw";
import assert from "node:assert";
import { expect } from "vitest";

import { it } from "../../__tests__/tmdb.test-context.ts";

import type { IndexerData } from "@repo/util-plugin-sdk/dto/types/indexer-data.type";

const createShow = (id: number, name: string) => ({
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

const trendingShowsQuery = `
  query TmdbTrendingShows($timeWindow: TMDBTrendingTimeWindow!) {
    tmdbTrendingShows(timeWindow: $timeWindow) {
      id
      type
      title
      posterUrl
      year
      isRequestable
    }
  }
`;

it.for(["day", "week"] as const)(
  'requests trending shows for the "%s" time window',
  async (timeWindow, { gqlContext, gqlServer, server }) => {
    server.use(
      http.get("**/trending/tv/:timeWindow", ({ params }) => {
        if (params["timeWindow"] !== timeWindow) {
          return HttpResponse.json(null, { status: 400 });
        }

        return HttpResponse.json({
          page: 1,
          total_pages: 1,
          total_results: 1,
          results: [createShow(1, "Test Show")],
        });
      }),
      http.get("**/tv/1/external_ids", () =>
        HttpResponse.json({ imdb_id: null, tvdb_id: 100 }),
      ),
    );

    const { body } = await gqlServer.executeOperation<{
      tmdbTrendingShows: IndexerData[];
    }>(
      { query: trendingShowsQuery, variables: { timeWindow } },
      { contextValue: gqlContext },
    );

    assert.ok(body.kind === "single");

    expect(body.singleResult.errors).toBeUndefined();
    expect(
      structuredClone(body.singleResult.data?.tmdbTrendingShows),
    ).toStrictEqual([
      {
        id: "100",
        type: "show",
        title: "Test Show",
        posterUrl: "https://image.tmdb.org/t/p/original/poster.jpg",
        year: 2024,
        isRequestable: true,
      },
    ]);
  },
);

it("surfaces shows without a TVDB ID as unrequestable", async ({
  gqlContext,
  gqlServer,
  server,
}) => {
  server.use(
    http.get("**/trending/tv/day", () =>
      HttpResponse.json({
        page: 1,
        total_pages: 1,
        total_results: 3,
        results: [
          createShow(1, "On TVDB"),
          createShow(2, "Not On TVDB"),
          createShow(3, "Lookup Fails"),
        ],
      }),
    ),
    http.get("**/tv/1/external_ids", () =>
      HttpResponse.json({ imdb_id: "tt1", tvdb_id: 100 }),
    ),
    http.get("**/tv/2/external_ids", () =>
      HttpResponse.json({ imdb_id: null, tvdb_id: null }),
    ),
    http.get("**/tv/3/external_ids", () =>
      HttpResponse.json(null, { status: 404 }),
    ),
  );

  const { body } = await gqlServer.executeOperation<{
    tmdbTrendingShows: Pick<IndexerData, "id" | "title" | "isRequestable">[];
  }>(
    {
      query: `
        query TmdbTrendingShows {
          tmdbTrendingShows(timeWindow: day) {
            id
            title
            isRequestable
          }
        }
      `,
    },
    { contextValue: gqlContext },
  );

  assert.ok(body.kind === "single");

  expect(body.singleResult.errors).toBeUndefined();
  expect(
    structuredClone(body.singleResult.data?.tmdbTrendingShows),
  ).toStrictEqual([
    { id: "100", title: "On TVDB", isRequestable: true },
    { id: "tmdb-2", title: "Not On TVDB", isRequestable: false },
    { id: "tmdb-3", title: "Lookup Fails", isRequestable: false },
  ]);
});

it("deduplicates shows with the same ID", async ({
  gqlContext,
  gqlServer,
  server,
}) => {
  server.use(
    http.get("**/trending/tv/day", () =>
      HttpResponse.json({
        page: 1,
        total_pages: 1,
        total_results: 2,
        results: [createShow(1, "First"), createShow(1, "First (Duplicate)")],
      }),
    ),
    http.get("**/tv/1/external_ids", () =>
      HttpResponse.json({ imdb_id: null, tvdb_id: 100 }),
    ),
  );

  const { body } = await gqlServer.executeOperation<{
    tmdbTrendingShows: Pick<IndexerData, "id" | "title">[];
  }>(
    {
      query: `
        query TmdbTrendingShows {
          tmdbTrendingShows(timeWindow: day) {
            id
            title
          }
        }
      `,
    },
    { contextValue: gqlContext },
  );

  assert.ok(body.kind === "single");

  expect(body.singleResult.errors).toBeUndefined();
  expect(
    structuredClone(body.singleResult.data?.tmdbTrendingShows),
  ).toStrictEqual([{ id: "100", title: "First (Duplicate)" }]);
});

it("returns an error if no trending shows are found", async ({
  gqlContext,
  gqlServer,
  server,
}) => {
  server.use(
    http.get("**/trending/tv/day", () =>
      HttpResponse.json({
        page: 1,
        total_pages: 0,
        total_results: 0,
        results: [],
      }),
    ),
  );

  const { body } = await gqlServer.executeOperation(
    { query: trendingShowsQuery, variables: { timeWindow: "day" } },
    { contextValue: gqlContext },
  );

  assert.ok(body.kind === "single");

  expect(body.singleResult.errors?.[0]?.message).toBe(
    "No trending shows found.",
  );
});
