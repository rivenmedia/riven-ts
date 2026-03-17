import { DateTime } from "luxon";

import { NotificationPayload } from "../schemas/notification-payload.schema.ts";

import type { MediaItem } from "@repo/util-plugin-sdk/dto/entities";

interface NotificationEvent {
  item: MediaItem;
  downloader: string;
  provider: string | null;
  durationFromRequestToDownload: number;
}

export function buildNotificationPayload(
  event: NotificationEvent,
  eventName: string,
): NotificationPayload {
  const { item } = event;

  return NotificationPayload.parse({
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
  });
}
