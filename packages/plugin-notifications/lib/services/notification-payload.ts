import { Movie, ShowLikeMediaItem } from "@repo/util-plugin-sdk/dto/entities";

import { DateTime } from "luxon";

import { NotificationPayload } from "../schemas/notification-payload.schema.ts";

import type { ParamsFor } from "@repo/util-plugin-sdk";
import type { MediaItemDownloadSuccessEvent } from "@repo/util-plugin-sdk/schemas/events/media-item.download.success.event";

export function buildNotificationPayload(
  {
    downloader,
    item,
    provider,
    durationFromRequestToDownload,
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
    durationSeconds: Math.round(durationFromRequestToDownload),
    timestamp: DateTime.utc().toISO(),
  });
}
