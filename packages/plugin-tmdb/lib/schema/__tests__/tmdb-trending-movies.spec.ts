import { http, HttpResponse } from "msw";
import assert from "node:assert";
import { expect } from "vitest";

import { trendingMoviesHandler } from "../../__generated__/handlers/trendingMoviesHandler.ts";
import { it } from "../../__tests__/tmdb.test-context.ts";

import type { TrendingMoviesQueryResponseSchema } from "../../__generated__/zod/trendingMoviesSchema.ts";
import type { TmdbIndexerData } from "../types/tmdb-indexer-data.type.ts";

const trendingMoviesQuery = `
  query TmdbTrendingMovies($timeWindow: TMDBTrendingMoviesTimeWindow!) {
    tmdbTrendingMovies(timeWindow: $timeWindow) {
      id
      title
      overview
      posterUrl
      backdropUrl
      language
      releaseDate
    }
  }
`;

it.for(["day", "week"] as const)(
  'requests trending movies for the "%s" time window',
  async (timeWindow, { gqlContext, gqlServer, server }) => {
    server.use(
      trendingMoviesHandler(({ params }) => {
        if (params["time_window"] !== timeWindow) {
          return HttpResponse.json(null, { status: 400 });
        }

        return HttpResponse.json({
          results: [
            {
              id: 1,
              title: "Test Movie",
              overview: "Test Overview",
              posterUrl: null,
              backdropUrl: null,
              language: null,
              releaseDate: null,
            },
          ],
        });
      }),
    );

    const { body } = await gqlServer.executeOperation<{
      tmdbTrendingMovies: TmdbIndexerData[];
    }>(
      {
        query: trendingMoviesQuery,
        variables: { timeWindow },
      },
      { contextValue: gqlContext },
    );

    assert.ok(body.kind === "single");

    expect(body.singleResult.errors).toBeUndefined();
    expect(
      structuredClone(body.singleResult.data?.tmdbTrendingMovies),
    ).toStrictEqual([
      {
        id: "1",
        title: "Test Movie",
        overview: "Test Overview",
        posterUrl: null,
        backdropUrl: null,
        language: null,
        releaseDate: null,
      },
    ]);
  },
);

it("maps trending movies to indexer data", async ({
  gqlContext,
  gqlServer,
  server,
}) => {
  server.use(
    http.get("**/trending/movie/day", () =>
      HttpResponse.json<TrendingMoviesQueryResponseSchema>({
        results: [
          {
            id: 1,
            title: "Test Movie",
            overview: "Test Overview",
            poster_path: "/poster.jpg",
            backdrop_path: "/backdrop.jpg",
            original_language: "en",
            release_date: "2024-01-01",
          },
        ],
      }),
    ),
  );

  const { body } = await gqlServer.executeOperation<{
    tmdbTrendingMovies: TmdbIndexerData[];
  }>(
    {
      query: trendingMoviesQuery,
      variables: { timeWindow: "day" },
    },
    { contextValue: gqlContext },
  );

  assert.ok(body.kind === "single");

  expect(body.singleResult.errors).toBeUndefined();
  expect(
    structuredClone(body.singleResult.data?.tmdbTrendingMovies),
  ).toStrictEqual([
    {
      id: "1",
      title: "Test Movie",
      overview: "Test Overview",
      posterUrl: "https://image.tmdb.org/t/p/original/poster.jpg",
      backdropUrl: "https://image.tmdb.org/t/p/original/backdrop.jpg",
      language: "en",
      releaseDate: expect.stringMatching(/^2024-01-01T/u),
    },
  ]);
});

it("skips movies without an ID, title, or overview", async ({
  gqlContext,
  gqlServer,
  server,
}) => {
  server.use(
    trendingMoviesHandler({
      results: [
        { title: "No ID", overview: "Test Overview" },
        { id: 2, overview: "No Title" },
        { id: 3, title: "No Overview" },
        { id: 4, title: "Valid Movie", overview: "Test Overview" },
      ],
    }),
  );

  const { body } = await gqlServer.executeOperation<{
    tmdbTrendingMovies: Pick<TmdbIndexerData, "id" | "title">[];
  }>(
    {
      query: `
        query TmdbTrendingMovies {
          tmdbTrendingMovies(timeWindow: day) {
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
    structuredClone(body.singleResult.data?.tmdbTrendingMovies),
  ).toStrictEqual([{ id: "4", title: "Valid Movie" }]);
});

it("deduplicates movies with the same ID", async ({
  gqlContext,
  gqlServer,
  server,
}) => {
  server.use(
    trendingMoviesHandler({
      results: [
        { id: 1, title: "First Movie", overview: "Test Overview" },
        { id: 2, title: "Second Movie", overview: "Test Overview" },
        {
          id: 1,
          title: "First Movie (Duplicate)",
          overview: "Test Overview",
        },
      ],
    }),
  );

  const { body } = await gqlServer.executeOperation<{
    tmdbTrendingMovies: Pick<TmdbIndexerData, "id" | "title">[];
  }>(
    {
      query: `
        query TmdbTrendingMovies {
          tmdbTrendingMovies(timeWindow: day) {
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
    structuredClone(body.singleResult.data?.tmdbTrendingMovies),
  ).toStrictEqual([
    { id: "1", title: "First Movie (Duplicate)" },
    { id: "2", title: "Second Movie" },
  ]);
});

it("returns an error if no trending movies are found", async ({
  gqlContext,
  gqlServer,
  server,
}) => {
  server.use(trendingMoviesHandler({ results: [] }));

  const { body } = await gqlServer.executeOperation(
    {
      query: trendingMoviesQuery,
      variables: { timeWindow: "day" },
    },
    { contextValue: gqlContext },
  );

  assert.ok(body.kind === "single");

  expect(body.singleResult.errors?.[0]?.message).toBe(
    "No trending movies found.",
  );
});

it("rejects an invalid time window", async ({ gqlContext, gqlServer }) => {
  const { body } = await gqlServer.executeOperation(
    {
      query: trendingMoviesQuery,
      variables: { timeWindow: "month" },
    },
    { contextValue: gqlContext },
  );

  assert.ok(body.kind === "single");

  expect(body.singleResult.data).toBeUndefined();

  expect(body.singleResult.errors).toHaveLength(1);
  expect(body.singleResult.errors?.[0]?.extensions?.["code"]).toBe(
    "BAD_USER_INPUT",
  );
});
