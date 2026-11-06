import assert from "node:assert";
import { expect } from "vitest";

import { movieDetailsHandler } from "../../__generated__/handlers/movieDetailsHandler.ts";
import { movieRecommendationsHandler } from "../../__generated__/handlers/movieRecommendationsHandler.ts";
import { createMovieDetailsQueryResponse } from "../../__generated__/mocks/createMovieDetails.ts";
import { it } from "../../__tests__/tmdb.test-context.ts";

import type { IndexerData } from "@repo/util-plugin-sdk/dto/types/indexer-data.type";

it("returns item recommendations", async ({
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
    movieRecommendationsHandler({
      page: 1,
      results: [
        {
          adult: false,
          backdrop_path: "/6KrodMTWn9hNZBhrwOYd8snqtVp.jpg",
          id: 86_838,
          title: "Seven Psychopaths",
          original_title: "Seven Psychopaths",
          overview:
            "A struggling screenwriter inadvertently becomes entangled in the Los Angeles criminal underworld after his oddball friends kidnap a gangster's beloved Shih Tzu.",
          poster_path: "/4ukEYAxlSivFcDG6vLxJB6PjTjg.jpg",
          media_type: "movie",
          original_language: "en",
          genre_ids: [35, 80],
          popularity: 8.3923,
          release_date: "2012-10-12",
          softcore: false,
          video: false,
          vote_average: 6.817,
          vote_count: 4435,
        },
        {
          adult: false,
          backdrop_path: "/5pLaYZGbweHYULiNiRehPxYuUnn.jpg",
          id: 2640,
          title: "Heathers",
          original_title: "Heathers",
          overview:
            'A girl who halfheartedly tries to be part of the "in crowd" of her school meets a rebel who teaches her a more devious way to play social politics: by killing the popular kids.',
          poster_path: "/rtzcrwgsuESV2adSDhIuLyQoZmp.jpg",
          media_type: "movie",
          original_language: "en",
          genre_ids: [35, 80],
          popularity: 7.0363,
          release_date: "1989-03-31",
          softcore: false,
          video: false,
          vote_average: 7.25,
          vote_count: 1958,
        },
        {
          adult: false,
          backdrop_path: "/eIcJq4QDmToJeu4g6fS4iLPKY8n.jpg",
          id: 4543,
          title: "Monty Python's The Meaning of Life",
          original_title: "Monty Python's The Meaning of Life",
          overview:
            "Life's questions are 'answered' in a series of outrageous vignettes, beginning with a staid London insurance company which transforms before our eyes into a pirate ship. Then there's the National Health doctors who try to claim a healthy liver from a still-living donor. The world's most voracious glutton brings the art of vomiting to new heights before his spectacular demise.",
          poster_path: "/9yavZ9WgEZIpWi2EbVW8At9RPdo.jpg",
          media_type: "movie",
          original_language: "en",
          genre_ids: [35],
          popularity: 5.9587,
          release_date: "1983-03-31",
          softcore: false,
          video: false,
          vote_average: 7.314,
          vote_count: 2189,
        },
      ],
      total_pages: 26,
      total_results: 519,
    }),
  );

  const { body } = await gqlServer.executeOperation<{
    tmdbItem: {
      recommendations: IndexerData[];
    };
  }>(
    {
      query: `
        query TmdbItemRecommendations {
          tmdbItem(id: 1) {
            recommendations {
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
    structuredClone(body.singleResult.data?.tmdbItem.recommendations),
  ).toStrictEqual([
    { __typename: "TmdbIndexerData", id: "86838" },
    { __typename: "TmdbIndexerData", id: "2640" },
    { __typename: "TmdbIndexerData", id: "4543" },
  ]);
});

it("returns null if there are no recommendations", async ({
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
    movieRecommendationsHandler({
      page: 1,
      results: [],
      total_pages: 1,
      total_results: 0,
    }),
  );

  const { body } = await gqlServer.executeOperation<{
    tmdbItem: {
      recommendations: IndexerData[];
    };
  }>(
    {
      query: `
        query TmdbItemRecommendations {
          tmdbItem(id: 1) {
            recommendations {
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

  expect(body.singleResult.data?.tmdbItem.recommendations).toBeNull();
});
