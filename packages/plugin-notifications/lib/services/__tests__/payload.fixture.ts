import { DateTime } from "luxon";

import type { NotificationPayload } from "../../schemas/notification-payload.schema.ts";

export const notificationPayloadFixture = {
  event: "riven.media-item.download.success",
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
