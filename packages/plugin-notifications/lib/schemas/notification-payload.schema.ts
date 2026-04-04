import { MediaItemType } from "@repo/util-plugin-sdk/dto/enums/media-item-type.enum";

import { type } from "arktype";

export const NotificationPayload = type({
  event: "string > 0",
  title: "string > 0",
  fullTitle: "string > 0",
  type: MediaItemType,
  year: "number > 0",
  imdbId: "string | null",
  tmdbId: "string | null",
  tvdbId: "string | null",
  posterPath: "string.url",
  downloader: "string > 0",
  provider: "string | null",
  durationSeconds: "number >= 0",
  timestamp: "string.date.iso",
});

export type NotificationPayload = typeof NotificationPayload.infer;
