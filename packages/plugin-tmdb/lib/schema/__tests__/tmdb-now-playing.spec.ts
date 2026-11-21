import { expect } from "vitest";

import { movieNowPlayingListHandler } from "../../__generated__/handlers/movieNowPlayingListHandler.ts";
import { it } from "../../__tests__/tmdb.test-context.ts";

import type { TmdbIndexerData } from "../types/tmdb-indexer-data.type.ts";

const nowPlayingQuery = `
  query TmdbNowPlaying {
    tmdbNowPlaying {
      id
      title
    }
  }
`;

it("returns the now playing movies that have an overview, without duplicates", async ({
  gqlContext,
  gqlServer,
  server,
}) => {
  server.use(
    movieNowPlayingListHandler({
      results: [
        { id: 1, title: "First Movie", overview: "Overview" },
        { id: 2, title: "No Overview", overview: "" },
        { id: 3, title: "Second Movie", overview: "Overview" },
        { id: 1, title: "First Movie (Duplicate)", overview: "Overview" },
      ],
    }),
  );

  const { body } = await gqlServer.executeOperation<{
    tmdbNowPlaying: Pick<TmdbIndexerData, "id" | "title">[];
  }>({ query: nowPlayingQuery }, { contextValue: gqlContext });

  expect.assert(body.kind === "single");
  expect(body.singleResult.errors).toBeUndefined();
  expect(structuredClone(body.singleResult.data?.tmdbNowPlaying)).toStrictEqual(
    [
      { id: "1", title: "First Movie (Duplicate)" },
      { id: "3", title: "Second Movie" },
    ],
  );
});

it("returns an error when there are no now playing movies", async ({
  gqlContext,
  gqlServer,
  server,
}) => {
  server.use(movieNowPlayingListHandler({ results: [] }));

  const { body } = await gqlServer.executeOperation(
    { query: nowPlayingQuery },
    { contextValue: gqlContext },
  );

  expect.assert(body.kind === "single");
  expect(body.singleResult.errors).toMatchObject([
    { message: "No now playing movies found." },
  ]);
});

it.for([
  { releaseDate: "2023-01-15", expected: "Winter 2023" },
  { releaseDate: "2023-03-24", expected: "Spring 2023" },
  { releaseDate: "2023-05-31", expected: "Spring 2023" },
  { releaseDate: "2023-06-01", expected: "Summer 2023" },
  { releaseDate: "2023-08-21", expected: "Summer 2023" },
  { releaseDate: "2023-09-01", expected: "Fall 2023" },
  { releaseDate: "2023-11-09", expected: "Fall 2023" },
  { releaseDate: "2023-12-15", expected: "Winter 2024" },
  { releaseDate: "2024-02-15", expected: "Winter 2024" },
  { releaseDate: "", expected: null },
])(
  "labels a movie released on $releaseDate as $expected",
  async ({ releaseDate, expected }, { gqlContext, gqlServer, server }) => {
    server.use(
      movieNowPlayingListHandler({
        results: [
          {
            id: 1,
            title: "Test Movie",
            overview: "Overview",
            release_date: releaseDate,
          },
        ],
      }),
    );

    const { body } = await gqlServer.executeOperation<{
      tmdbNowPlaying: { seasonLabel: string | null }[];
    }>(
      {
        query: `
          query TmdbNowPlaying {
            tmdbNowPlaying {
              seasonLabel
            }
          }
        `,
      },
      { contextValue: gqlContext },
    );

    expect.assert(body.kind === "single");
    expect(body.singleResult.errors).toBeUndefined();
    expect(body.singleResult.data?.tmdbNowPlaying[0]?.seasonLabel).toBe(
      expected,
    );
  },
);
