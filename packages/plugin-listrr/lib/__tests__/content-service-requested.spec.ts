import { createMockPluginSettings } from "@repo/util-plugin-testing/create-mock-plugin-settings";

import { HttpResponse } from "msw";
import { expect } from "vitest";

import { getApiListMoviesIdSortbySortbydirectionPageHandler } from "../__generated__/handlers/getApiListMoviesIdSortbySortbydirectionPageHandler.ts";
import { getApiListShowsIdSortbySortbydirectionPageHandler } from "../__generated__/handlers/getApiListShowsIdSortbySortbydirectionPageHandler.ts";
import { createListrrContractsModelsAPIMovieDto } from "../__generated__/mocks/listrr/contracts/models/API/createMovieDto.ts";
import { createListrrContractsModelsAPIShowDto } from "../__generated__/mocks/listrr/contracts/models/API/createShowDto.ts";
import { ListrrSettings } from "../listrr-settings.schema.ts";
import { it } from "./listrr.test-context.ts";

const movieList = "64b7f2f5e13e4b6f8c8e4d1a";
const showList = "64b7f2f5e13e4b6f8c8e4d1b";

it.override(
  "settings",
  createMockPluginSettings(ListrrSettings, {
    apiKey: "listrr-api-key",
    movieLists: [movieList],
    showLists: [showList],
    updateIntervalSeconds: 600,
  }),
);

it("returns the items of the configured movie and show lists with the update interval", async ({
  dataSourceMap,
  plugin,
  server,
  settings,
  logger,
}) => {
  const contentServiceRequestedHook =
    plugin.hooks["riven.content-service.requested"];

  expect.assert(contentServiceRequestedHook);

  const requestedLists: string[] = [];

  server.use(
    getApiListMoviesIdSortbySortbydirectionPageHandler(({ params }) => {
      requestedLists.push(`movies:${String(params["id"])}`);

      return HttpResponse.json({
        pages: 1,
        count: 1,
        items: [
          createListrrContractsModelsAPIMovieDto({
            id: "movie-1",
            imDbId: "tt0137523",
            tmDbId: 550,
          }),
        ],
      });
    }),
    getApiListShowsIdSortbySortbydirectionPageHandler(({ params }) => {
      requestedLists.push(`shows:${String(params["id"])}`);

      return HttpResponse.json({
        pages: 1,
        count: 1,
        items: [
          createListrrContractsModelsAPIShowDto({
            id: "show-1",
            imDbId: "tt0903747",
            tvDbId: 81_189,
            tmDbId: 1396,
          }),
        ],
      });
    }),
  );

  await expect(
    contentServiceRequestedHook({
      dataSources: dataSourceMap,
      settings,
      event: {},
      logger,
    }),
  ).resolves.toStrictEqual({
    movies: [{ imdbId: "tt0137523", tmdbId: "550" }],
    shows: [{ imdbId: "tt0903747", tvdbId: "81189", tmdbId: "1396" }],
    updateIntervalSeconds: 600,
  });

  expect(requestedLists).toStrictEqual([
    `movies:${movieList}`,
    `shows:${showList}`,
  ]);
});

it("validates the plugin without a connection check", async ({
  dataSourceMap,
  plugin,
  settings,
}) => {
  await expect(
    plugin.validator({ dataSources: dataSourceMap, settings }),
  ).resolves.toBe(true);
});
