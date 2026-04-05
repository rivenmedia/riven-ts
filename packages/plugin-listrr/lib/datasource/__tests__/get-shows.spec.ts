import { HttpResponse, http } from "msw";
import { expect } from "vitest";

import { getApiListShowsIdSortbySortbydirectionPageHandler as getShowsHandler } from "../../__generated__/handlers/getApiListShowsIdSortbySortbydirectionPageHandler.ts";
import { createGetApiListShowsIdSortbySortbydirectionPageQueryResponse as getShowsResponse } from "../../__generated__/mocks/createGetApiListShowsIdSortbySortbydirectionPage.ts";
import { createListrrContractsModelsAPIShowDto } from "../../__generated__/mocks/listrr/contracts/models/API/createShowDto.ts";
import { it } from "../../__tests__/listrr.test-context.ts";
import { ListrrAPI } from "../listrr.datasource.ts";

import type { GetApiListShowsIdSortbySortbydirectionPageQueryResponseSchema as GetShowsResponse } from "../../__generated__/zod/getApiListShowsIdSortbySortbydirectionPageSchema.ts";
import type { ListrrContractsModelsAPIShowDtoSchema as ListrrShow } from "../../__generated__/zod/listrr/contracts/models/API/showDtoSchema.ts";

it("returns an empty array if no content lists are provided", async ({
  dataSourceMap,
}) => {
  const listrrApi = dataSourceMap.get(ListrrAPI);
  const shows = await listrrApi.getShows(new Set());

  expect(shows).toEqual([]);
});

it("retrieves shows from each provided list", async ({
  server,
  dataSourceMap,
}) => {
  const contentLists = new Set([
    "64b7f2f5e13e4b6f8c8e4d1a",
    "64b7f2f5e13e4b6f8c8e4d1b",
  ]);

  server.use(
    getShowsHandler((info) => {
      if (
        !info.params["id"] ||
        !contentLists.has(info.params["id"].toString())
      ) {
        return HttpResponse.error();
      }

      return HttpResponse.json<GetShowsResponse>(
        getShowsResponse({
          pages: 1,
          count: 1,
          items: [
            createListrrContractsModelsAPIShowDto({
              id: info.params["id"].toString(),
            }),
          ],
        }),
      );
    }),
  );

  const listrrApi = dataSourceMap.get(ListrrAPI);
  const shows = await listrrApi.getShows(contentLists);

  expect(shows.length).toBe(2);
});

it("paginates through all pages of the list", async ({
  server,
  dataSourceMap,
}) => {
  const contentLists = new Set(["64b7f2f5e13e4b6f8c8e4d1c"]);
  const totalPages = 3;
  const itemsPerPage = 2;

  server.use(
    getShowsHandler((info) => {
      if (!info.params["id"] || !info.params["page"]) {
        return HttpResponse.error();
      }

      const page = parseInt(info.params["page"].toString(), 10);

      if (page > totalPages) {
        return HttpResponse.error();
      }

      return HttpResponse.json<GetShowsResponse>(
        getShowsResponse({
          pages: totalPages,
          count: totalPages * itemsPerPage,
          items: Array.from({ length: itemsPerPage }).map((_, i) =>
            createListrrContractsModelsAPIShowDto({
              id: `show-${page.toString()}-${i.toString()}`,
            }),
          ),
        }),
      );
    }),
  );

  const listrrApi = dataSourceMap.get(ListrrAPI);
  const shows = await listrrApi.getShows(contentLists);

  expect(shows.length).toBe(totalPages * itemsPerPage);
});

it("deduplicates shows that appear in multiple lists", async ({
  server,
  dataSourceMap,
}) => {
  const buildMockShow = (id: number) =>
    createListrrContractsModelsAPIShowDto({
      id: `show-${id.toString()}`,
      imDbId: `imdb-id-${id.toString()}`,
      tmDbId: id,
    });

  const items = {
    "64b7f2f5e13e4b6f8c8e4d1a": [1, 2, 3].map(buildMockShow),
    "64b7f2f5e13e4b6f8c8e4d1b": [3, 4, 5].map(buildMockShow),
    "64b7f2f5e13e4b6f8c8e4d1c": [2, 4, 5, 6, 7, 8].map(buildMockShow),
  } satisfies Record<string, ListrrShow[]>;

  server.use(
    ...Object.entries(items).map(([id, shows]) =>
      http.get(`**/api/List/Shows/${id}/:sortBy/:sortByDirection/:page`, () =>
        HttpResponse.json(
          getShowsResponse({
            items: shows,
          }),
        ),
      ),
    ),
  );

  const listrrApi = dataSourceMap.get(ListrrAPI);
  const shows = await listrrApi.getShows(new Set(Object.keys(items)));

  expect(shows).toHaveLength(8);
});
