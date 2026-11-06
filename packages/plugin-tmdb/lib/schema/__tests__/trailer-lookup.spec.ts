import assert from "node:assert";
import { expect } from "vitest";

import { movieDetailsHandler } from "../../__generated__/handlers/movieDetailsHandler.ts";
import { movieVideosHandler } from "../../__generated__/handlers/movieVideosHandler.ts";
import { createMovieDetailsQueryResponse } from "../../__generated__/mocks/createMovieDetails.ts";
import { it } from "../../__tests__/tmdb.test-context.ts";

import type { Trailer } from "@repo/util-plugin-sdk/dto/types/trailer.type";

it("does not return unofficial trailers", async ({
  gqlContext,
  gqlServer,
  server,
}) => {
  server.use(
    movieDetailsHandler(
      createMovieDetailsQueryResponse({
        id: 1,
        genres: [],
      }),
    ),
    movieVideosHandler({
      id: 1,
      results: [
        {
          iso_639_1: "en",
          iso_3166_1: "US",
          name: "35mm Theatrical Trailer #3",
          key: "cdx31ak4KbQ",
          site: "YouTube",
          size: 2160,
          type: "Trailer",
          official: false,
          id: "653c6111c8a5ac00e3a09f82",
          published_at: "2022-03-07T06:00:19.000Z",
        },
      ],
    }),
  );

  const { body } = await gqlServer.executeOperation<{
    tmdbItem: {
      trailer: Trailer;
    };
  }>(
    {
      query: `
        query TmdbItemTrailer {
          tmdbItem(id: 1) {
            trailer {
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

  expect(body.singleResult.data?.tmdbItem.trailer).toBeNull();
});

it("returns trailers in the specified language", async ({
  gqlContext,
  gqlServer,
  server,
}) => {
  server.use(
    movieDetailsHandler(
      createMovieDetailsQueryResponse({
        id: 1,
        genres: [],
      }),
    ),
    movieVideosHandler({
      id: 1,
      results: [
        {
          iso_639_1: "ja",
          iso_3166_1: "JP",
          name: "35mm Theatrical Trailer #3",
          key: "cdx31ak4KbQ",
          site: "YouTube",
          size: 2160,
          type: "Trailer",
          official: true,
          id: "653c6111c8a5ac00e3a09f82",
          published_at: "2022-03-07T06:00:19.000Z",
        },
      ],
    }),
  );

  const { body } = await gqlServer.executeOperation<{
    tmdbItem: {
      trailer: Trailer;
    };
  }>(
    {
      query: `
        query TmdbItemTrailer {
          tmdbItem(id: 1) {
            trailer(language: "ja-JP") {
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

  expect(body.singleResult.data?.tmdbItem.trailer.id).toBe(
    "653c6111c8a5ac00e3a09f82",
  );
});

it("does not return trailers in non-matching languages", async ({
  gqlContext,
  gqlServer,
  server,
}) => {
  server.use(
    movieDetailsHandler(
      createMovieDetailsQueryResponse({
        id: 1,
        genres: [],
      }),
    ),
    movieVideosHandler({
      id: 1,
      results: [
        {
          iso_639_1: "ja",
          iso_3166_1: "JP",
          name: "35mm Theatrical Trailer #3",
          key: "cdx31ak4KbQ",
          site: "YouTube",
          size: 2160,
          type: "Trailer",
          official: true,
          id: "653c6111c8a5ac00e3a09f82",
          published_at: "2022-03-07T06:00:19.000Z",
        },
      ],
    }),
  );

  const { body } = await gqlServer.executeOperation<{
    tmdbItem: {
      trailer: Trailer;
    };
  }>(
    {
      query: `
        query TmdbItemTrailer {
          tmdbItem(id: 1) {
            trailer(language: "en-GB") {
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

  expect(body.singleResult.data?.tmdbItem.trailer).toBeNull();
});

it("returns the highest resolution trailer when multiple options are available", async ({
  gqlContext,
  gqlServer,
  server,
}) => {
  server.use(
    movieDetailsHandler(
      createMovieDetailsQueryResponse({
        id: 1,
        genres: [],
      }),
    ),
    movieVideosHandler({
      id: 1,
      results: [
        {
          iso_639_1: "en",
          iso_3166_1: "US",
          name: "35mm Theatrical Trailer #3",
          key: "cdx31ak4KbQ",
          site: "YouTube",
          size: 720,
          type: "Trailer",
          official: true,
          id: "720-res",
          published_at: "2022-03-07T06:00:19.000Z",
        },
        {
          iso_639_1: "en",
          iso_3166_1: "US",
          name: "35mm Theatrical Trailer #3",
          key: "cdx31ak4KbQ",
          site: "YouTube",
          size: 2160,
          type: "Trailer",
          official: true,
          id: "2160-res",
          published_at: "2022-03-07T06:00:19.000Z",
        },
        {
          iso_639_1: "en",
          iso_3166_1: "US",
          name: "35mm Theatrical Trailer #3",
          key: "cdx31ak4KbQ",
          site: "YouTube",
          size: 1080,
          type: "Trailer",
          official: true,
          id: "1080-res",
          published_at: "2022-03-07T06:00:19.000Z",
        },
      ],
    }),
  );

  const { body } = await gqlServer.executeOperation<{
    tmdbItem: {
      trailer: Trailer;
    };
  }>(
    {
      query: `
        query TmdbItemTrailer {
          tmdbItem(id: 1) {
            trailer(language: "en-GB") {
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

  expect(body.singleResult.data?.tmdbItem.trailer?.id).toBe("2160-res");
});

it("does not return non-trailers", async ({
  gqlContext,
  gqlServer,
  server,
}) => {
  server.use(
    movieDetailsHandler(
      createMovieDetailsQueryResponse({
        id: 1,
        genres: [],
      }),
    ),
    movieVideosHandler({
      id: 1,
      results: [
        {
          iso_639_1: "en",
          iso_3166_1: "US",
          name: "The Dream Sequence",
          key: "mpj9dL7swwk",
          site: "YouTube",
          size: 720,
          type: "Clip",
          official: true,
          id: "622d5cc322931a00454e588c",
          published_at: "2022-03-09T01:00:20.000Z",
        },
      ],
    }),
  );

  const { body } = await gqlServer.executeOperation<{
    tmdbItem: {
      trailer: Trailer;
    };
  }>(
    {
      query: `
        query TmdbItemTrailer {
          tmdbItem(id: 1) {
            trailer(language: "en-GB") {
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

  expect(body.singleResult.data?.tmdbItem.trailer).toBeNull();
});
