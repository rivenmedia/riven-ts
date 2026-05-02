import { Movie, ShowLikeMediaItem } from "@rivenmedia/plugin-sdk/dto/entities";

import { DateTime } from "luxon";

import { NotificationPayload } from "../schemas/notification-payload.schema.ts";

import type { ParamsFor } from "@rivenmedia/plugin-sdk";
import type { MediaItemDownloadSuccessEvent } from "@rivenmedia/plugin-sdk/schemas/events/media-item.download.success.event";

export function buildNotificationPayload(
  {
    downloader,
    item,
    provider,
    durationMs,
  }: ParamsFor<MediaItemDownloadSuccessEvent>,
  eventType: MediaItemDownloadSuccessEvent["type"],
): NotificationPayload {
  return NotificationPayload.encode({
    event: eventType,
    title: item.title,
    fullTitle: item.fullTitle,
    type: item.type,
    year: item.year ?? null,
    imdbId: item.imdbId ?? null,
    tmdbId: item instanceof Movie ? item.tmdbId : null,
    tvdbId: item instanceof ShowLikeMediaItem ? item.tvdbId : null,
    posterPath: item.posterPath ?? null,
    downloader,
    provider,
    durationSeconds: Math.round(durationMs / 1000),
    timestamp: DateTime.utc().toISO(),
  });
}
