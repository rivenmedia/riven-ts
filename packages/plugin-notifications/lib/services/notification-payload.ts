import { DateTime } from "luxon";

import type { MediaItem } from "@repo/util-plugin-sdk/dto/entities";

export interface NotificationPayload {
  event: string;
  title: string;
  fullTitle: string;
  type: "movie" | "show" | "season" | "episode";
  year: number | null;
  imdbId: string | null;
  tmdbId: string | null;
  tvdbId: string | null;
  posterPath: string | null;
  downloader: string;
  provider: string | null;
  durationSeconds: number;
  timestamp: string;
}

export function buildNotificationPayload(
  event: {
    item: MediaItem;
    downloader: string;
    provider: string | null;
    durationFromRequestToDownload: number;
  },
  eventName: string,
): NotificationPayload {
  const { item } = event;

  return {
    event: eventName,
    title: item.title,
    fullTitle: item.fullTitle,
    type: item.type,
    year: item.year ?? null,
    imdbId: item.imdbId ?? null,
    tmdbId: item.tmdbId ?? null,
    tvdbId: item.tvdbId ?? null,
    posterPath: item.posterPath ?? null,
    downloader: event.downloader,
    provider: event.provider,
    durationSeconds: Math.round(event.durationFromRequestToDownload),
    timestamp: DateTime.utc().toISO(),
  };
}
