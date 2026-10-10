import { http, HttpResponse } from "msw";
import assert from "node:assert";
import { expect } from "vitest";

import { it } from "#__tests__/tmdb.test-context.ts";

import type { MovieDetails200Schema } from "#__generated__/zod/movieDetailsSchema.ts";
import type { MovieNowPlayingListQueryResponseSchema } from "#__generated__/zod/movieNowPlayingListSchema.ts";
import type { Genre } from "@repo/util-plugin-sdk/dto/types/genre.type";

it("resolves localised genres from their TMDB IDs", async ({
  gqlContext,
  gqlServer,
  server,
}) => {
  server.use(
    http.get("**/movie/now_playing", () =>
      HttpResponse.json<MovieNowPlayingListQueryResponseSchema>({
        results: [
          {
            id: 1,
            title: "Test Movie",
            overview: "Test Overview",
            genre_ids: [28],
          },
        ],
      }),
    ),
    http.get("**/genre/movie/list", ({ request }) => {
      const language = new URL(request.url).searchParams.get("language");

      if (!language) {
        return HttpResponse.json(null, { status: 400 });
      }

      if (language === "it") {
        return HttpResponse.json({
          genres: [
            {
              id: 28,
              name: "Azione",
            },
          ],
        });
      }

      return HttpResponse.json({
        genres: [
          {
            id: 28,
            name: "Action",
          },
        ],
      });
    }),
  );

  const { body } = await gqlServer.executeOperation<{
    tmdbNowPlayingEn: {
      genres: Genre[];
    }[];
    tmdbNowPlayingIt: {
      genres: {
        id: number;
        name: string;
      }[];
    }[];
  }>(
    {
      query: `
        query TmdbNowPlaying {
          tmdbNowPlayingEn: tmdbNowPlaying {
            genres(locale: "en") {
              id
              name
            }
          }
          tmdbNowPlayingIt: tmdbNowPlaying {
            genres(locale: "it") {
              id
              name
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
    structuredClone(body.singleResult.data?.tmdbNowPlayingEn[0]?.genres),
  ).toStrictEqual([
    {
      id: "28",
      name: "Action",
    },
  ]);

  expect(
    structuredClone(body.singleResult.data?.tmdbNowPlayingIt[0]?.genres),
  ).toStrictEqual([
    {
      id: "28",
      name: "Azione",
    },
  ]);
});

it("only returns genres from the item's genre IDs", async ({
  gqlContext,
  gqlServer,
  server,
}) => {
  server.use(
    http.get("**/movie/now_playing", () =>
      HttpResponse.json<MovieNowPlayingListQueryResponseSchema>({
        results: [
          {
            id: 1,
            title: "Test Movie",
            overview: "Test Overview",
            genre_ids: [28],
          },
        ],
      }),
    ),
    http.get("**/genre/movie/list", () =>
      HttpResponse.json({
        genres: [
          {
            id: 28,
            name: "Action",
          },
          {
            id: 12,
            name: "Adventure",
          },
          {
            id: 16,
            name: "Animation",
          },
        ],
      }),
    ),
  );

  const { body } = await gqlServer.executeOperation<{
    tmdbNowPlaying: {
      genres: Genre[];
    }[];
  }>(
    {
      query: `
        query TmdbItemGenres {
          tmdbNowPlaying {
            genres(locale: "en") {
              id
              name
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
    structuredClone(body.singleResult.data?.tmdbNowPlaying[0]?.genres),
  ).toStrictEqual([
    {
      id: "28",
      name: "Action",
    },
  ]);
});

it("returns the item's genres if already present", async ({
  gqlContext,
  gqlServer,
  server,
}) => {
  server.use(
    http.get("**/movie/1", () =>
      HttpResponse.json<MovieDetails200Schema>({
        id: 1,
        title: "Test Movie",
        overview: "Test Overview",
        genres: [
          {
            id: 28,
            name: "Action",
          },
        ],
      }),
    ),
  );

  const { body } = await gqlServer.executeOperation<{
    tmdbItem: {
      genres: Genre[];
    };
  }>(
    {
      query: `
        query TmdbItemGenres {
          tmdbItem(id: 1) {
            genres(locale: "en") {
              id
              name
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
    structuredClone(body.singleResult.data?.tmdbItem.genres),
  ).toStrictEqual([
    {
      id: "28",
      name: "Action",
    },
  ]);
});
