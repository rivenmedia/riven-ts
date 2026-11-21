import { createMockPluginSettings } from "@repo/util-plugin-testing/create-mock-plugin-settings";

import { http, HttpResponse } from "msw/http";
import { expect, vi } from "vitest";

import { PlexSettings } from "../plex-settings.schema.ts";
import { it } from "./plex.test-context.ts";

import type { UserWatchlistResponse } from "../schemas/user-watchlist-response.schema.ts";
import type { z } from "zod";

it.override("settings", () =>
  createMockPluginSettings(PlexSettings, {
    plexServerUrl: "http://localhost:32400",
    plexToken: "test-plex-token",
    watchlistEnabled: true,
  }),
);

it("returns watchlist content", async ({
  dataSourceMap,
  plugin,
  server,
  settings,
  logger,
}) => {
  const providerListRequestedHook =
    plugin.hooks["riven.content-service.requested"];

  expect.assert(providerListRequestedHook);

  server.use(
    http.get("**/library/sections/watchlist/all", () =>
      HttpResponse.json<z.input<typeof UserWatchlistResponse>>({
        MediaContainer: {
          size: 2,
          totalSize: 2,
          Metadata: [
            {
              title: "Test Movie",
              year: 2024,
              type: "movie",
              Guid: [{ id: "imdb://tt1234567" }, { id: "tmdb://1234567" }],
            },
            {
              title: "Test Show",
              year: 2024,
              type: "show",
              Guid: [{ id: "imdb://tt1234568" }, { id: "tvdb://1234568" }],
            },
          ],
        },
      }),
    ),
  );

  const response = await providerListRequestedHook({
    dataSources: dataSourceMap,
    settings,
    event: {},
    logger,
  });

  expect(response).toStrictEqual({
    movies: [
      {
        imdbId: "tt1234567",
        tmdbId: "1234567",
      },
    ],
    shows: [
      {
        imdbId: "tt1234568",
        tvdbId: "1234568",
      },
    ],
    updateIntervalSeconds: 60,
  });
});

it("handles an empty watchlist when Plex omits Metadata", async ({
  dataSourceMap,
  plugin,
  server,
  settings,
  logger,
}) => {
  const providerListRequestedHook =
    plugin.hooks["riven.content-service.requested"];

  expect.assert(providerListRequestedHook);

  server.use(
    http.get("**/library/sections/watchlist/all", () =>
      HttpResponse.json<z.input<typeof UserWatchlistResponse>>({
        MediaContainer: {
          size: 0,
          totalSize: 0,
        },
      }),
    ),
  );

  const response = await providerListRequestedHook({
    dataSources: dataSourceMap,
    settings,
    event: {},
    logger,
  });

  expect(response).toStrictEqual({
    movies: [],
    shows: [],
    updateIntervalSeconds: 60,
  });
});

it("paginates items in long watchlists", async ({
  dataSourceMap,
  plugin,
  server,
  settings,
  logger,
}) => {
  const providerListRequestedHook =
    plugin.hooks["riven.content-service.requested"];

  expect.assert(providerListRequestedHook);

  server.use(
    http.get("**/library/sections/watchlist/all", ({ request }) => {
      const containerStart = Number(
        request.headers.get("x-plex-container-start"),
      );

      if (containerStart === 0) {
        return HttpResponse.json<z.input<typeof UserWatchlistResponse>>({
          MediaContainer: {
            size: 100,
            totalSize: 150,
            Metadata: [
              {
                title: "Test Movie",
                year: 2024,
                type: "movie",
                Guid: [{ id: "imdb://tt1234567" }, { id: "tmdb://1234567" }],
              },
              {
                title: "Test Show",
                year: 2024,
                type: "show",
                Guid: [{ id: "imdb://tt1234568" }, { id: "tvdb://1234568" }],
              },
            ],
          },
        });
      } else if (containerStart === 100) {
        return HttpResponse.json<z.input<typeof UserWatchlistResponse>>({
          MediaContainer: {
            size: 50,
            totalSize: 150,
            Metadata: [
              {
                title: "Test Movie 2",
                year: 2024,
                type: "movie",
                Guid: [{ id: "imdb://tt1234569" }, { id: "tmdb://1234569" }],
              },
              {
                title: "Test Show 2",
                year: 2024,
                type: "show",
                Guid: [{ id: "imdb://tt1234570" }, { id: "tvdb://1234570" }],
              },
            ],
          },
        });
      }

      return HttpResponse.error();
    }),
  );

  const response = await providerListRequestedHook({
    dataSources: dataSourceMap,
    settings,
    event: {},
    logger,
  });

  expect(response).toStrictEqual({
    movies: [
      {
        imdbId: "tt1234567",
        tmdbId: "1234567",
      },
      {
        imdbId: "tt1234569",
        tmdbId: "1234569",
      },
    ],
    shows: [
      {
        imdbId: "tt1234568",
        tvdbId: "1234568",
      },
      {
        imdbId: "tt1234570",
        tvdbId: "1234570",
      },
    ],
    updateIntervalSeconds: 60,
  });
});

it("skips duplicate items and items without external IDs", async ({
  dataSourceMap,
  plugin,
  server,
  settings,
  logger,
}) => {
  const contentServiceRequestedHook =
    plugin.hooks["riven.content-service.requested"];

  expect.assert(contentServiceRequestedHook);

  const warn = vi.spyOn(logger, "warn");

  server.use(
    http.get("**/library/sections/watchlist/all", () =>
      HttpResponse.json<z.input<typeof UserWatchlistResponse>>({
        MediaContainer: {
          size: 4,
          totalSize: 4,
          Metadata: [
            {
              title: "Test Movie",
              year: 2024,
              type: "movie",
              Guid: [{ id: "imdb://tt1234567" }, { id: "tmdb://1234567" }],
            },
            {
              title: "Test Movie (Duplicate)",
              year: 2024,
              type: "movie",
              Guid: [{ id: "tmdb://1234567" }],
            },
            {
              title: "Unmatched Movie",
              year: 2023,
              type: "movie",
              Guid: [],
            },
            {
              title: "Unmatched Show",
              year: null,
              type: "show",
              Guid: [],
            },
          ],
        },
      }),
    ),
  );

  await expect(
    contentServiceRequestedHook({
      dataSources: dataSourceMap,
      settings,
      event: {},
      logger,
    }),
  ).resolves.toStrictEqual({
    movies: [{ imdbId: "tt1234567", tmdbId: "1234567" }],
    shows: [],
    updateIntervalSeconds: 60,
  });

  expect(warn.mock.calls).toStrictEqual([
    ["Unable to extract external IDs from Unmatched Movie (2023)"],
    ["Unable to extract external IDs from Unmatched Show"],
  ]);
});
