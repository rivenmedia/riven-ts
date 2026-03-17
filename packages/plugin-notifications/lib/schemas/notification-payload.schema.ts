import { MediaItemType } from "@repo/util-plugin-sdk/dto/enums/media-item-type.enum";

import z from "zod";

export const NotificationPayload = z.object({
  event: z.string(),
  title: z.string(),
  fullTitle: z.string(),
  type: MediaItemType,
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
