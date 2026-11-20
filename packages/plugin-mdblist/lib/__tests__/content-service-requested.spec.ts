import { createMockPluginSettings } from "@repo/util-plugin-testing/create-mock-plugin-settings";

import { HttpResponse, http } from "msw";
import { expect } from "vitest";

import { MdbListSettings } from "../mdblist-settings.schema.ts";
import { it } from "./mdblist.test-context.ts";

it.override(
  "settings",
  createMockPluginSettings(MdbListSettings, {
    apiKey: "mock-api-key",
    lists: ["user/movies", "user/shows"],
    updateIntervalSeconds: 600,
  }),
);

it("returns the items of the configured lists with the update interval", async ({
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
  const item = {
    rank: null,
    adult: 0,
    title: "Title",
    imdb_id: null,
    tvdb_id: null,
    language: null,
    release_year: null,
    spoken_language: null,
    country: null,
  };

  server.use(
    http.get(
      "https://api.mdblist.com/lists/user/:listname/items",
      ({ params }) => {
        const listName = String(params["listname"]);

        requestedLists.push(listName);

        return HttpResponse.json(
          listName === "movies"
            ? {
                movies: [
                  { ...item, id: 1, mediatype: "movie", ids: { tmdb: 550 } },
                ],
              }
            : {
                shows: [{ ...item, id: 2, mediatype: "show", tvdb_id: 81_189 }],
              },
        );
      },
    ),
  );

  const response = await contentServiceRequestedHook({
    dataSources: dataSourceMap,
    settings,
    event: {},
    logger,
  });

  expect(requestedLists).toStrictEqual(["movies", "shows"]);
  expect(response).toStrictEqual({
    movies: [
      {
        imdbId: undefined,
        tmdbId: "550",
        externalRequestId: undefined,
        tvdbId: undefined,
      },
    ],
    shows: [{ imdbId: undefined, tvdbId: "81189" }],
    updateIntervalSeconds: 600,
  });
});
