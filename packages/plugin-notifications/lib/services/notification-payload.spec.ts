import { Episode, Movie } from "@repo/util-plugin-sdk/dto/entities";

import { DateTime } from "luxon";
import { expect, it, onTestFinished, vi } from "vitest";

import { buildNotificationPayload } from "./notification-payload.ts";

const now = DateTime.fromISO("2026-01-02T03:04:05.000Z", { zone: "utc" });

it("describes a downloaded movie", () => {
  vi.useFakeTimers({ now: now.toJSDate() });
  onTestFinished(() => {
    vi.useRealTimers();
  });

  const movie = Object.assign(new Movie(), {
    title: "Inception",
    fullTitle: "Inception (2010)",
    year: 2010,
    imdbId: "tt1375666",
    tmdbId: "27205",
    posterPath: "https://image.tmdb.org/t/p/w500/poster.jpg",
  });

  expect(
    buildNotificationPayload(
      {
        item: movie,
        downloader: "@repo/plugin-stremthru",
        provider: "realdebrid",
        durationMs: 45_499,
      },
      "riven.media-item.download.success",
    ),
  ).toStrictEqual({
    event: "riven.media-item.download.success",
    title: "Inception",
    fullTitle: "Inception (2010)",
    type: "movie",
    year: 2010,
    imdbId: "tt1375666",
    tmdbId: "27205",
    tvdbId: null,
    posterPath: "https://image.tmdb.org/t/p/w500/poster.jpg",
    downloader: "@repo/plugin-stremthru",
    provider: "realdebrid",
    durationSeconds: 45,
    timestamp: "2026-01-02T03:04:05.000Z",
  });
});

it("describes a downloaded episode by its TVDB ID", () => {
  const episode = Object.assign(new Episode(), {
    title: "Pilot",
    fullTitle: "Show - S01E01 - Pilot",
    year: null,
    imdbId: null,
    tvdbId: "349232",
    posterPath: null,
  });

  expect(
    buildNotificationPayload(
      {
        item: episode,
        downloader: "@repo/plugin-stremthru",
        provider: null,
        durationMs: 1500,
      },
      "riven.media-item.download.success",
    ),
  ).toMatchObject({
    type: "episode",
    year: null,
    imdbId: null,
    tmdbId: null,
    tvdbId: "349232",
    posterPath: null,
    provider: null,
    durationSeconds: 2,
  });
});

it("rejects an item without a title", () => {
  const movie = Object.assign(new Movie(), {
    title: "",
    fullTitle: "",
    tmdbId: "27205",
  });

  expect(() =>
    buildNotificationPayload(
      { item: movie, downloader: "downloader", provider: null, durationMs: 0 },
      "riven.media-item.download.success",
    ),
  ).toThrow(/"path": \[\s*"title"\s*\]/u);
});
