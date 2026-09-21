import { createMockPluginSettings } from "@repo/util-plugin-testing/create-mock-plugin-settings";

import { http, HttpResponse } from "msw";
import { expect } from "vitest";

import { PlexSettings } from "../plex-settings.schema.ts";
import { it } from "./plex.test-context.ts";

import type { RSSWatchlistResponse } from "../schemas/rss-watchlist-response.schema.ts";
import type { UserWatchlistResponse } from "../schemas/user-watchlist-response.schema.ts";
import type { z } from "zod";

it.override("settings", () =>
  createMockPluginSettings(PlexSettings, {
    plexServerUrl: "http://localhost:32400",
    plexToken: "test-plex-token",
    watchlistEnabled: "true",
    rssUrls: JSON.stringify([
      "https://rss.plex.tv/00000000-0000-0000-0000-000000000000",
      "https://rss.plex.tv/00000000-0000-0000-0000-000000000001",
    ]),
  }),
);

it("returns watchlist content from the provided RSS URLs", async ({
  dataSourceMap,
  plugin,
  server,
  settings,
  logger,
}) => {
  const { rssUrls: [rssUrl1, rssUrl2] = [] } = settings.get(PlexSettings);
  const providerListRequestedHook =
    plugin.hooks["riven.content-service.requested"];

  expect.assert(providerListRequestedHook);
  expect.assert(rssUrl1);
  expect.assert(rssUrl2);

  server.use(
    http.get("**/library/sections/watchlist/all", () =>
      HttpResponse.json<z.input<typeof UserWatchlistResponse>>({
        MediaContainer: {
          size: 0,
          totalSize: 0,
          Metadata: [],
        },
      }),
    ),
    http.get(rssUrl1, () =>
      HttpResponse.json<z.input<typeof RSSWatchlistResponse>>({
        items: [
          {
            category: "movie",
            guids: ["imdb://tt1234567", "tmdb://1234567"],
            title: "Test Movie (2024)",
          },
        ],
      }),
    ),
    http.get(rssUrl2, () =>
      HttpResponse.json<z.input<typeof RSSWatchlistResponse>>({
        items: [
          {
            category: "show",
            guids: ["imdb://tt1234568", "tvdb://1234568"],
            title: "Test Show (2026)",
          },
        ],
      }),
    ),
  );

  const response = await providerListRequestedHook({
    dataSources: dataSourceMap,
    settings,
    event: {},
    logger,
  });

  expect(response).toStrictEqual(
    expect.objectContaining({
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
    }),
  );
});

it.only("deduplicates items found in multiple RSS feeds or account watchlist", async ({
  dataSourceMap,
  plugin,
  server,
  settings,
  logger,
}) => {
  const { rssUrls: [rssUrl1, rssUrl2] = [] } = settings.get(PlexSettings);
  const providerListRequestedHook =
    plugin.hooks["riven.content-service.requested"];

  expect.assert(providerListRequestedHook);
  expect.assert(rssUrl1);
  expect.assert(rssUrl2);

  server.use(
    http.get("**/library/sections/watchlist/all", () =>
      HttpResponse.json<z.input<typeof UserWatchlistResponse>>({
        MediaContainer: {
          size: 0,
          totalSize: 0,
          Metadata: [
            {
              type: "movie",
              Guid: [{ id: "imdb://tt1234567" }, { id: "tmdb://1234567" }],
              title: "Test Movie",
              year: 2024,
            },
          ],
        },
      }),
    ),
    http.get(rssUrl1, () =>
      HttpResponse.json<z.input<typeof RSSWatchlistResponse>>({
        items: [
          {
            category: "movie",
            guids: ["imdb://tt1234567", "tmdb://1234567"],
            title: "Test Movie (2024)",
          },
        ],
      }),
    ),
    http.get(rssUrl2, () =>
      HttpResponse.json<z.input<typeof RSSWatchlistResponse>>({
        items: [
          {
            category: "movie",
            guids: ["imdb://tt1234567", "tmdb://1234567"],
            title: "Test Movie (2024)",
          },
        ],
      }),
    ),
  );

  const response = await providerListRequestedHook({
    dataSources: dataSourceMap,
    settings,
    event: {},
    logger,
  });

  expect(response).toStrictEqual(
    expect.objectContaining({
      movies: [
        {
          imdbId: "tt1234567",
          tmdbId: "1234567",
        },
      ],
      shows: [],
    }),
  );
});
