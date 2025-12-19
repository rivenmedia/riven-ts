import {
  createListrrContractsModelsAPIShowDto,
  getApiListShowsIdSortbySortbydirectionPageHandler as getShowsHandler,
  createGetApiListShowsIdSortbySortbydirectionPageQueryResponse as getShowsResponse,
  type GetApiListShowsIdSortbySortbydirectionPageQueryResponse as GetShowsResponse,
  type ListrrContractsModelsAPIShowDto as ListrrShow,
} from "../__generated__/index.ts";
import { ListrrAPI } from "./listrr.datasource.ts";
import { expect, vi } from "vitest";
import { it } from "@repo/core-util-vitest-test-context";
import { http, HttpResponse } from "msw";

const cache = {
  get: vi.fn(),
  set: vi.fn(),
  delete: vi.fn(),
};

it("returns an empty array if no content lists are provided", async () => {
  const listrrApi = new ListrrAPI({ cache, token: "1234" });
  const shows = await listrrApi.getShows(new Set());

  expect(shows).toEqual([]);
});

it("retrieves shows from each provided list", async ({ server }) => {
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

  const listrrApi = new ListrrAPI({ cache, token: "1234" });
  const shows = await listrrApi.getShows(contentLists);

  expect(shows.length).toBe(2);
});

it("paginates through all pages of the list", async ({ server }) => {
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

  const listrrApi = new ListrrAPI({ cache, token: "1234" });
  const shows = await listrrApi.getShows(contentLists);

  expect(shows.length).toBe(totalPages * itemsPerPage);
});

it("dedupes shows that appear in multiple lists", async ({ server }) => {
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

  const listrrApi = new ListrrAPI({ cache, token: "1234" });
  const shows = await listrrApi.getShows(new Set(Object.keys(items)));

  expect(shows).toHaveLength(8);
});
