import { MediaItemType } from "@rivenmedia/plugin-sdk/dto/enums/media-item-type.enum";
import { z } from "@rivenmedia/plugin-sdk/validation";

export const NotificationPayload = z.object({
  event: z.string().min(1),
  title: z.string().min(1),
  fullTitle: z.string().min(1),
  type: MediaItemType,
  year: z.int().nullable(),
  imdbId: z.string().nullable(),
  tmdbId: z.string().nullable(),
  tvdbId: z.string().nullable(),
  posterPath: z.url().nullable(),
  downloader: z.string().min(1),
  provider: z.string().nullable(),
  durationSeconds: z.number().nonnegative(),
  timestamp: z.iso.datetime(),
});

export type NotificationPayload = z.infer<typeof NotificationPayload>;
