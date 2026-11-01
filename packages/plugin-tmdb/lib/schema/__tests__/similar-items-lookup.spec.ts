import assert from "node:assert";
import { expect } from "vitest";

import { movieDetailsHandler } from "../../__generated__/handlers/movieDetailsHandler.ts";
import { movieSimilarHandler } from "../../__generated__/handlers/movieSimilarHandler.ts";
import { createMovieDetailsQueryResponse } from "../../__generated__/mocks/createMovieDetails.ts";
import { it } from "../../__tests__/tmdb.test-context.ts";

import type { IndexerData } from "@repo/util-plugin-sdk/dto/types/indexer-data.type";

it("returns similar items", async ({ server, gqlServer, gqlContext }) => {
  server.use(
    movieDetailsHandler(
      createMovieDetailsQueryResponse({
        id: 1,
        genres: [],
      }),
    ),
    movieSimilarHandler({
      page: 1,
      results: [
        {
          adult: false,
          backdrop_path: "/OR8oloCZ3klJtB7Y0i8pSqWw5a.jpg",
          genre_ids: [53, 12],
          id: 213,
          title: "North by Northwest",
          original_language: "en",
          original_title: "North by Northwest",
          overview:
            "Advertising man Roger Thornhill is mistaken for a spy, triggering a deadly cross-country chase.",
          popularity: 10.6544,
          poster_path: "/kNOFPQrel9YFCVzI0DF8FnCEpCw.jpg",
          release_date: "1959-08-06",
          video: false,
          vote_average: 7.961,
          vote_count: 4659,
        },
        {
          adult: false,
          backdrop_path: "/hTP6H7sNlWXdGxAciXQSjNJ1ob7.jpg",
          genre_ids: [18, 53, 12],
          id: 204,
          title: "The Wages of Fear",
          original_language: "fr",
          original_title: "Le Salaire de la peur",
          overview:
            "In a run-down South American town, four men are paid to drive trucks loaded with nitroglycerin into the jungle through to the oil field. Friendships are tested and rivalries develop as they embark upon the perilous journey.",
          popularity: 6.2649,
          poster_path: "/sNOvIp4X0fmCMfgEs2ww5IyMgFm.jpg",
          release_date: "1953-04-22",
          video: false,
          vote_average: 8,
          vote_count: 1136,
        },
        {
          adult: false,
          backdrop_path: "/hzmmXx6UeYQeylioNbliFKjSbV7.jpg",
          genre_ids: [12, 28, 53],
          id: 253,
          title: "Live and Let Die",
          original_language: "en",
          original_title: "Live and Let Die",
          overview:
            "James Bond must investigate a mysterious murder case of a British agent in New Orleans. Soon he finds himself up against a gangster boss named Mr. Big.",
          popularity: 9.9956,
          poster_path: "/39qkrjqMZs6utwNmihVImC3ghas.jpg",
          release_date: "1973-06-27",
          video: false,
          vote_average: 6.503,
          vote_count: 2382,
        },
      ],
      total_pages: 1001,
      total_results: 20_001,
    }),
  );

  const { body } = await gqlServer.executeOperation<{
    tmdbItem: {
      similarItems: IndexerData[];
    };
  }>(
    {
      query: `
        query TmdbItemSimilarItems {
          tmdbItem(id: 1) {
            similarItems {
              __typename
              id
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
    structuredClone(body.singleResult.data?.tmdbItem.similarItems),
  ).toStrictEqual([
    { __typename: "TmdbIndexerData", id: "213" },
    { __typename: "TmdbIndexerData", id: "204" },
    { __typename: "TmdbIndexerData", id: "253" },
  ]);
});

it("returns null if there are no similar items", async ({
  server,
  gqlServer,
  gqlContext,
}) => {
  server.use(
    movieDetailsHandler(
      createMovieDetailsQueryResponse({
        id: 1,
        genres: [],
      }),
    ),
    movieSimilarHandler({
      page: 1,
      results: [],
      total_pages: 1,
      total_results: 0,
    }),
  );

  const { body } = await gqlServer.executeOperation<{
    tmdbItem: {
      similarItems: IndexerData[];
    };
  }>(
    {
      query: `
        query TmdbItemSimilarItems {
          tmdbItem(id: 1) {
            similarItems {
              id
            }
          }
        }
      `,
    },
    { contextValue: gqlContext },
  );

  assert.ok(body.kind === "single");

  expect(body.singleResult.errors).toBeUndefined();

  expect(body.singleResult.data?.tmdbItem.similarItems).toBeNull();
});
