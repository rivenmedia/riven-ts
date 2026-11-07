import assert from "node:assert";
import { expect } from "vitest";

import { movieCreditsHandler } from "../../__generated__/handlers/movieCreditsHandler.ts";
import { movieDetailsHandler } from "../../__generated__/handlers/movieDetailsHandler.ts";
import { createMovieDetailsQueryResponse } from "../../__generated__/mocks/createMovieDetails.ts";
import { it } from "../../__tests__/tmdb.test-context.ts";

import type { CastMember } from "@repo/util-plugin-sdk/dto/types/cast-member.type";

it("returns the movie cast", async ({ server, gqlServer, gqlContext }) => {
  server.use(
    movieDetailsHandler(
      createMovieDetailsQueryResponse({
        id: 1,
        genres: [],
      }),
    ),
    movieCreditsHandler({
      id: 1,
      cast: [
        {
          adult: false,
          gender: 2,
          id: 6193,
          known_for_department: "Acting",
          name: "Leonardo DiCaprio",
          original_name: "Leonardo DiCaprio",
          popularity: 8.6897,
          profile_path: "/wo2hJpn04vbtmh0B9utCFdsQhxM.jpg",
          cast_id: 1,
          character: "Dom Cobb",
          credit_id: "52fe4534c3a368484e04de03",
          order: 0,
        },
        {
          adult: false,
          gender: 2,
          id: 24_045,
          known_for_department: "Acting",
          name: "Joseph Gordon-Levitt",
          original_name: "Joseph Gordon-Levitt",
          popularity: 6.1421,
          profile_path: "/z2FA8js799xqtfiFjBTicFYdfk.jpg",
          cast_id: 3,
          character: "Arthur",
          credit_id: "52fe4534c3a368484e04de0b",
          order: 1,
        },
        {
          adult: false,
          gender: 2,
          id: 3899,
          known_for_department: "Acting",
          name: "Ken Watanabe",
          original_name: "渡辺謙",
          popularity: 3.5039,
          profile_path: "/psAXOYp9SBOXvg6AXzARDedNQ9P.jpg",
          cast_id: 2,
          character: "Saito",
          credit_id: "52fe4534c3a368484e04de07",
          order: 2,
        },
      ],
      crew: [],
    }),
  );

  const { body } = await gqlServer.executeOperation<{
    tmdbItem: {
      cast: CastMember[];
    };
  }>(
    {
      query: `
        query TmdbItemCast {
          tmdbItem(id: 1) {
            cast {
              id
              name
              character
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
    { id: "6193", name: "Leonardo DiCaprio", character: "Dom Cobb" },
    { id: "24045", name: "Joseph Gordon-Levitt", character: "Arthur" },
    { id: "3899", name: "Ken Watanabe", character: "Saito" },
  ]);
});

it("returns null if there is no available movie cast", async ({
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
    movieCreditsHandler({
      id: 1,
      crew: [],
      cast: [],
    }),
  );

  const { body } = await gqlServer.executeOperation<{
    tmdbItem: {
      cast: CastMember[];
    };
  }>(
    {
      query: `
        query TmdbItemCast {
          tmdbItem(id: 1) {
            cast {
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

  expect(body.singleResult.data?.tmdbItem.cast).toBeNull();
});
