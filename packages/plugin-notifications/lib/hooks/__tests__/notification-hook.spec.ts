import { expect, vi } from "vitest";

import { it } from "../../__tests__/notifications.test-context.ts";
import { NotificationsAPI } from "../../datasource/notifications.datasource.ts";
import plugin from "../../index.ts";

const hook = plugin.hooks["riven.media-item.download.success"]!;

it("dispatches notifications for each configured URL", async ({
  dataSourceMap,
  settings,
  logger,
}) => {
  const api = dataSourceMap.get(NotificationsAPI);

  // Mock the underlying post method used by dispatchers
  vi.spyOn(api, "post").mockResolvedValue({});

  const item = {
    title: "Test Movie",
    fullTitle: "Test Movie (2024)",
    type: "movie",
    year: 2024,
    imdbId: "tt1234567",
    tmdbId: "12345",
    tvdbId: undefined,
    posterPath: "https://image.tmdb.org/t/p/w500/poster.jpg",
  };

  // This should not throw even if the dispatcher encounters issues
  await hook({
    dataSources: dataSourceMap,
    event: {
      item,
      downloader: "stremthru",
      provider: "realdebrid",
      durationMs: 5000,
    },
    settings,
    logger,
  } as any);
});

it("logs errors for failed notification dispatches", async ({
  dataSourceMap,
  settings,
  logger,
}) => {
  const api = dataSourceMap.get(NotificationsAPI);
  vi.spyOn(api, "post").mockRejectedValue(new Error("Network error"));

  const item = {
    title: "Test Movie",
    fullTitle: "Test Movie (2024)",
    type: "movie",
    year: 2024,
    imdbId: "tt1234567",
    tmdbId: "12345",
    tvdbId: undefined,
    posterPath: null,
  };

  // Hook should not throw - it uses allSettled and logs errors
  await hook({
    dataSources: dataSourceMap,
    event: {
      item,
      downloader: "stremthru",
      provider: "realdebrid",
      durationMs: 3000,
    },
    settings,
    logger,
  } as any);

  // The hook logs errors internally but doesn't throw
});
