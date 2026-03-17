import { it } from "@repo/util-plugin-testing/plugin-test-context";

import { DateTime } from "luxon";
import { expect } from "vitest";

import { buildEmbed } from "./build-embed.ts";

import type { NotificationPayload } from "../../../../schemas/notification-payload.schema.ts";

const mockPayload = {
  event: "download.success",
  title: "Inception",
  fullTitle: "Inception (2010)",
  type: "movie",
  year: 2010,
  imdbId: "tt1375666",
  tmdbId: "27205",
  tvdbId: null,
  posterPath: "https://image.tmdb.org/t/p/w500/poster.jpg",
  downloader: "realdebrid",
  provider: "torrentio",
  durationSeconds: 45,
  timestamp: DateTime.utc().toISO(),
} as const satisfies NotificationPayload;

it("includes the thumbnail when posterPath is provided", () => {
  const embed = buildEmbed(mockPayload);

  expect(embed.thumbnail).toEqual({ url: mockPayload.posterPath });
});

it("does not include the thumbnail when posterPath is null", () => {
  const embed = buildEmbed({ ...mockPayload, posterPath: null });

  expect(embed.thumbnail).toBeUndefined();
});
