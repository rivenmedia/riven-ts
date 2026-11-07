import assert from "node:assert";
import { expect } from "vitest";

import { movieDetailsHandler } from "../../__generated__/handlers/movieDetailsHandler.ts";
import { movieImagesHandler } from "../../__generated__/handlers/movieImagesHandler.ts";
import { createMovieDetailsQueryResponse } from "../../__generated__/mocks/createMovieDetails.ts";
import { it } from "../../__tests__/tmdb.test-context.ts";

import type { ItemImage } from "@repo/util-plugin-sdk/dto/types/item-image.type";

it("returns the logo with the closest requested size / aspect ratio", async ({
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
    movieImagesHandler({
      id: 1,
      backdrops: [],
      logos: [
        {
          aspect_ratio: 4.638,
          height: 389,
          iso_639_1: "en",
          file_path: "/7Uqhv24pGJs4Ns31NoOPWFJGWNG.png",
          vote_average: 5.172,
          vote_count: 1,
          width: 1804,
        },
        {
          aspect_ratio: 1.329,
          height: 1275,
          iso_639_1: "en",
          file_path: "/v7JwpiYf2knmf2R2mLLvJmNxy9x.png",
          vote_average: 0,
          vote_count: 0,
          width: 1694,
        },
        {
          aspect_ratio: 1.5,
          height: 290,
          iso_639_1: "en",
          file_path: "/y9dOBfqWvCdxQcwBSPT2nfXGJpi.png",
          vote_average: 0,
          vote_count: 0,
          width: 435,
        },
      ],
      posters: [],
    }),
  );

  const { body } = await gqlServer.executeOperation<{
    tmdbItem: {
      logo: ItemImage;
    };
  }>(
    {
      query: `
        query TmdbItemLogo {
          tmdbItem(id: 1) {
            logo(width: 1422, aspectRatio: 1.5) {
              url
            }
          }
        }
      `,
    },
    { contextValue: gqlContext },
  );

  assert.ok(body.kind === "single");

  expect(body.singleResult.errors).toBeUndefined();

  expect(body.singleResult.data?.tmdbItem.logo.url).toMatch(
    /\/v7JwpiYf2knmf2R2mLLvJmNxy9x.png$/iu,
  );
});

it("returns the highest rated logo if no size or aspect ratio is requested", async ({
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
    movieImagesHandler({
      id: 1,
      backdrops: [],
      logos: [
        {
          aspect_ratio: 4.638,
          height: 389,
          iso_639_1: "en",
          file_path: "/7Uqhv24pGJs4Ns31NoOPWFJGWNG.png",
          vote_average: 5.172,
          vote_count: 1,
          width: 1804,
        },
        {
          aspect_ratio: 1.329,
          height: 1275,
          iso_639_1: "en",
          file_path: "/v7JwpiYf2knmf2R2mLLvJmNxy9x.png",
          vote_average: 0,
          vote_count: 0,
          width: 1694,
        },
      ],
      posters: [],
    }),
  );

  const { body } = await gqlServer.executeOperation<{
    tmdbItem: {
      logo: ItemImage;
    };
  }>(
    {
      query: `
        query TmdbItemLogo {
          tmdbItem(id: 1) {
            logo {
              url
            }
          }
        }
      `,
    },
    { contextValue: gqlContext },
  );

  assert.ok(body.kind === "single");

  expect(body.singleResult.errors).toBeUndefined();

  expect(body.singleResult.data?.tmdbItem.logo.url).toMatch(
    /\/7Uqhv24pGJs4Ns31NoOPWFJGWNG.png$/iu,
  );
});

it("does not consider logos with known non-matching languages", async ({
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
    movieImagesHandler({
      id: 1,
      backdrops: [],
      logos: [
        {
          aspect_ratio: 5.203,
          height: 79,
          iso_639_1: "he",
          file_path: "/c1KLulrIhUqY5fT42nmC5aERGCp.png",
          vote_average: 5.312,
          vote_count: 1,
          width: 411,
        },
        {
          aspect_ratio: 8.502,
          height: 235,
          iso_639_1: "pt",
          file_path: "/qqAcl1YIT5Sa2nx8tKQcervQCco.png",
          vote_average: 5.312,
          vote_count: 1,
          width: 1998,
        },
        {
          aspect_ratio: 4.638,
          height: 389,
          iso_639_1: "en",
          file_path: "/7Uqhv24pGJs4Ns31NoOPWFJGWNG.png",
          vote_average: 5.172,
          vote_count: 1,
          width: 1804,
        },
      ],
      posters: [],
    }),
  );

  const { body } = await gqlServer.executeOperation<{
    tmdbItem: {
      logo: ItemImage;
    };
  }>(
    {
      query: `
        query TmdbItemLogo {
          tmdbItem(id: 1) {
            logo(width: 1422) {
              url
            }
          }
        }
      `,
    },
    { contextValue: gqlContext },
  );

  assert.ok(body.kind === "single");

  expect(body.singleResult.errors).toBeUndefined();

  expect(body.singleResult.data?.tmdbItem.logo.url).toMatch(
    /\/7Uqhv24pGJs4Ns31NoOPWFJGWNG.png$/iu,
  );
});

it("returns null if there are no available logos", async ({
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
    movieImagesHandler({
      id: 1,
      backdrops: [],
      logos: [],
      posters: [],
    }),
  );

  const { body } = await gqlServer.executeOperation<{
    tmdbItem: {
      logo: ItemImage;
    };
  }>(
    {
      query: `
        query TmdbItemLogo {
          tmdbItem(id: 1) {
            logo(width: 1422) {
            url
            }
          }
        }
      `,
    },
    { contextValue: gqlContext },
  );

  assert.ok(body.kind === "single");

  expect(body.singleResult.errors).toBeUndefined();

  expect(body.singleResult.data?.tmdbItem.logo).toBeNull();
});
