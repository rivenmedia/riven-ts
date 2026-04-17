import { Movie, ShowLikeMediaItem } from "@repo/util-plugin-sdk/dto/entities";

import { DateTime } from "luxon";

import { NotificationPayload } from "../schemas/notification-payload.schema.ts";

import type { MediaItemDownloadSuccessEvent } from "@repo/util-plugin-sdk/schemas/events/media-item.download.success.event";

export function buildNotificationPayload(
  event: Omit<MediaItemDownloadSuccessEvent, "type">,
  eventType: MediaItemDownloadSuccessEvent["type"],
): NotificationPayload {
  const { item } = event;

  return NotificationPayload.parse({
    event: eventType,
    title: item.title,
    fullTitle: item.fullTitle,
    type: item.type,
    year: item.year ?? null,
    imdbId: item.imdbId ?? null,
    ...(item instanceof ShowLikeMediaItem ? { tvdbId: item.tvdbId } : {}),
    ...(item instanceof Movie ? { tmdbId: item.tmdbId } : {}),
    posterPath: item.posterPath ?? null,
    downloader: event.downloader,
    provider: event.provider,
    durationSeconds: Math.round(event.durationFromRequestToDownload),
    timestamp: DateTime.utc().toISO(),
  });
}
