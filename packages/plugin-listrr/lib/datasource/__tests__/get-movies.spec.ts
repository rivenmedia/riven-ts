import { HttpResponse, http } from "msw";
import { expect } from "vitest";

import { getApiListMoviesIdSortbySortbydirectionPageHandler as getMoviesHandler } from "../../__generated__/handlers/getApiListMoviesIdSortbySortbydirectionPageHandler.ts";
import { createGetApiListMoviesIdSortbySortbydirectionPageQueryResponse as getMoviesResponse } from "../../__generated__/mocks/createGetApiListMoviesIdSortbySortbydirectionPage.ts";
import { createListrrContractsModelsAPIMovieDto } from "../../__generated__/mocks/listrr/contracts/models/API/createMovieDto.ts";
import { it } from "../../__tests__/listrr.test-context.ts";
import { ListrrAPI } from "../listrr.datasource.ts";

import type { GetApiListMoviesIdSortbySortbydirectionPageQueryResponseSchema as GetMoviesResponse } from "../../__generated__/zod/getApiListMoviesIdSortbySortbydirectionPageSchema.ts";
import type { ListrrContractsModelsAPIMovieDtoSchema as ListrrMovie } from "../../__generated__/zod/listrr/contracts/models/API/movieDtoSchema.ts";

it("returns an empty array if no content lists are provided", async ({
  dataSourceMap,
}) => {
  const listrrApi = dataSourceMap.get(ListrrAPI);
  const movies = await listrrApi.getMovies(new Set());

  expect(movies).toEqual([]);
});

it("retrieves movies from each provided list", async ({
  server,
  dataSourceMap,
}) => {
  const contentLists = new Set([
    "64b7f2f5e13e4b6f8c8e4d1a",
    "64b7f2f5e13e4b6f8c8e4d1b",
  ]);

  server.use(
    getMoviesHandler((info) => {
      if (
        !info.params["id"] ||
        !contentLists.has(info.params["id"].toString())
      ) {
        return HttpResponse.error();
      }

      return HttpResponse.json<GetMoviesResponse>(
        getMoviesResponse({
          pages: 1,
          count: 1,
          items: [
            createListrrContractsModelsAPIMovieDto({
              id: `movie-for-list-${info.params["id"].toString()}`,
            }),
          ],
        }),
      );
    }),
  );

  const listrrApi = dataSourceMap.get(ListrrAPI);
  const movies = await listrrApi.getMovies(contentLists);

  expect(movies.length).toBe(2);
});

it("paginates through all pages of the list", async ({
  server,
  dataSourceMap,
}) => {
  const contentLists = new Set(["64b7f2f5e13e4b6f8c8e4d1c"]);
  const totalPages = 3;
  const itemsPerPage = 2;

  server.use(
    getMoviesHandler((info) => {
      if (!info.params["id"] || !info.params["page"]) {
        return HttpResponse.error();
      }

      const page = parseInt(info.params["page"].toString(), 10);

      if (page > totalPages) {
        return HttpResponse.error();
      }

      return HttpResponse.json<GetMoviesResponse>(
        getMoviesResponse({
          pages: totalPages,
          count: totalPages * itemsPerPage,
          items: Array.from({ length: itemsPerPage }).map((_, i) =>
            createListrrContractsModelsAPIMovieDto({
              id: `movie-page-${page.toString()}-${i.toString()}`,
            }),
          ),
        }),
      );
    }),
  );

  const listrrApi = dataSourceMap.get(ListrrAPI);
  const movies = await listrrApi.getMovies(contentLists);

  expect(movies.length).toBe(totalPages * itemsPerPage);
});

it("dedupes movies that appear in multiple lists", async ({
  server,
  dataSourceMap,
}) => {
  const buildMockMovie = (id: number) =>
    createListrrContractsModelsAPIMovieDto({
      id: `movie-${id.toString()}`,
      imDbId: `imdb-id-${id.toString()}`,
      tmDbId: id,
    });

  const items = {
    "64b7f2f5e13e4b6f8c8e4d1a": [1, 2, 3].map(buildMockMovie),
    "64b7f2f5e13e4b6f8c8e4d1b": [3, 4, 5].map(buildMockMovie),
    "64b7f2f5e13e4b6f8c8e4d1c": [2, 4, 5, 6, 7, 8].map(buildMockMovie),
  } satisfies Record<string, ListrrMovie[]>;

  server.use(
    ...Object.entries(items).map(([id, movies]) =>
      http.get(`**/api/List/Movies/${id}/:sortBy/:sortByDirection/:page`, () =>
        HttpResponse.json(
          getMoviesResponse({
            items: movies,
          }),
        ),
      ),
    ),
  );

  const listrrApi = dataSourceMap.get(ListrrAPI);
  const movies = await listrrApi.getMovies(new Set(Object.keys(items)));

  expect(movies).toHaveLength(8);
});
