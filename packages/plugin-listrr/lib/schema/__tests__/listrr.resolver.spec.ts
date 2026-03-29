import { HttpResponse } from "msw";
import assert from "node:assert";
import { expect } from "vitest";

import {
  type GetApiListMoviesIdSortbySortbydirectionPageQueryResponse,
  type GetApiListShowsIdSortbySortbydirectionPageQueryResponse,
  createGetApiListMoviesIdSortbySortbydirectionPageQueryResponse,
  createGetApiListMyPageQueryResponse,
  createGetApiListShowsIdSortbySortbydirectionPageQueryResponse,
  createListrrContractsModelsAPIMovieDto,
  createListrrContractsModelsAPIShowDto,
  getApiListMoviesIdSortbySortbydirectionPageHandler,
  getApiListMyPageHandler,
  getApiListShowsIdSortbySortbydirectionPageHandler,
} from "../../__generated__/index.ts";
import { it } from "../../__tests__/listrr.test-context.ts";

it("returns movies when calling listrrMovies query", async ({
  gqlContext,
  gqlServer,
  server,
}) => {
  const contentLists = new Set([
    "64b7f2f5e13e4b6f8c8e4d1a",
    "64b7f2f5e13e4b6f8c8e4d1b",
  ]);

  server.use(
    getApiListMoviesIdSortbySortbydirectionPageHandler((info) => {
      if (
        !info.params["id"] ||
        !contentLists.has(info.params["id"].toString())
      ) {
        return HttpResponse.error();
      }

      return HttpResponse.json<GetApiListMoviesIdSortbySortbydirectionPageQueryResponse>(
        createGetApiListMoviesIdSortbySortbydirectionPageQueryResponse({
          pages: 1,
          count: 1,
          items: [
            createListrrContractsModelsAPIMovieDto({
              id: `movie-for-list-${info.params["id"].toString()}`,
              imDbId: `imdb-${info.params["id"].toString()}`,
              tmDbId: 1,
            }),
          ],
        }),
      );
    }),
  );

  const { body } = await gqlServer.executeOperation(
    {
      query: `
        query ListrrMovies($listIds: [String!]!) {
          listrrMovies(listIds: $listIds) {
            imdbId
            tmdbId
          }
        }
      `,
      variables: {
        listIds: ["64b7f2f5e13e4b6f8c8e4d1a", "64b7f2f5e13e4b6f8c8e4d1b"],
      },
    },
    { contextValue: gqlContext },
  );

  assert(body.kind === "single");

  expect(body.singleResult.errors).toBeUndefined();
  expect(body.singleResult.data?.["listrrMovies"]).toHaveLength(2);
});

it("returns shows when calling listrrShows query", async ({
  gqlContext,
  gqlServer,
  server,
}) => {
  const contentLists = new Set([
    "64b7f2f5e13e4b6f8c8e4d1a",
    "64b7f2f5e13e4b6f8c8e4d1b",
  ]);

  server.use(
    getApiListShowsIdSortbySortbydirectionPageHandler((info) => {
      if (
        !info.params["id"] ||
        !contentLists.has(info.params["id"].toString())
      ) {
        return HttpResponse.error();
      }

      return HttpResponse.json<GetApiListShowsIdSortbySortbydirectionPageQueryResponse>(
        createGetApiListShowsIdSortbySortbydirectionPageQueryResponse({
          pages: 1,
          count: 1,
          items: [
            createListrrContractsModelsAPIShowDto({
              id: `show-for-list-${info.params["id"].toString()}`,
              imDbId: `imdb-${info.params["id"].toString()}`,
              tmDbId: 1,
            }),
          ],
        }),
      );
    }),
  );

  const { body } = await gqlServer.executeOperation(
    {
      query: `
        query ListrrShows($listIds: [String!]!) {
          listrrShows(listIds: $listIds) {
            imdbId
            tmdbId
          }
        }
      `,
      variables: {
        listIds: ["64b7f2f5e13e4b6f8c8e4d1a", "64b7f2f5e13e4b6f8c8e4d1b"],
      },
    },
    { contextValue: gqlContext },
  );

  assert(body.kind === "single");

  expect(body.singleResult.errors).toBeUndefined();
  expect(body.singleResult.data?.["listrrShows"]).toHaveLength(2);
});

it('returns the user validation status when calling "listrrIsValid" query', async ({
  gqlContext,
  gqlServer,
  server,
}) => {
  server.use(
    getApiListMyPageHandler(() =>
      HttpResponse.json(createGetApiListMyPageQueryResponse()),
    ),
  );

  const { body } = await gqlServer.executeOperation(
    {
      query: `
        query ListrrIsValid {
          listrrIsValid
        }
      `,
    },
    { contextValue: gqlContext },
  );

  assert(body.kind === "single");

  expect(body.singleResult.errors).toBeUndefined();
  expect(body.singleResult.data?.["listrrIsValid"]).toBe(true);
});
