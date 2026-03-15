import { DateTime } from "luxon";
import z from "zod";

import type { MediaItem } from "@repo/util-plugin-sdk/dto/entities";

export const NotificationPayload = z.object({
  event: z.string(),
  title: z.string(),
  fullTitle: z.string(),
  type: z.enum(["movie", "show", "season", "episode"]),
  year: z.number().nullable(),
  imdbId: z.string().nullable(),
  tmdbId: z.string().nullable(),
  tvdbId: z.string().nullable(),
  posterPath: z.string().nullable(),
  downloader: z.string(),
  provider: z.string().nullable(),
  durationSeconds: z.number(),
  timestamp: z.string(),
});

export type NotificationPayload = z.infer<typeof NotificationPayload>;

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
