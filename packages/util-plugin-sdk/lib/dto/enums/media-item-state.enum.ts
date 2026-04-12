import { registerEnumType } from "type-graphql";

import type { ValueOf } from "type-fest";

export const MediaItemState = {
  UNKNOWN: "unknown",
  UNRELEASED: "unreleased",
  ONGOING: "ongoing",
  INDEXED: "indexed",
  SCRAPED: "scraped",
  DOWNLOADED: "downloaded",
  COMPLETED: "completed",
  PARTIALLY_COMPLETED: "partially_completed",
  FAILED: "failed",
  PAUSED: "paused",
} as const;

export type MediaItemState = ValueOf<typeof MediaItemState>;

registerEnumType(MediaItemState, {
  name: "MediaItemState",
  description: "The state of a media item in the processing pipeline.",
  valuesConfig: {
    COMPLETED: {
      description:
        "The media item has been fully processed and is available to be streamed.",
    },
    DOWNLOADED: {
      description:
        "The media item has been downloaded, but still requires post-processing.",
    },
    FAILED: {
      description: "The media item has failed.",
    },
    INDEXED: {
      description:
        "The media item has pulled information from its respective database (TMDB for movies, TVDB for shows).",
    },
    ONGOING: {
      description:
        "The media item is still being released, and will require periodic re-indexing. Does not apply to movies or episodes.",
    },
    PARTIALLY_COMPLETED: {
      description:
        "The media item was unable to complete processing for all items, and may retry in the future. Does not apply to movies.",
    },
    PAUSED: {
      description: "The media item has paused its processing.",
    },
    SCRAPED: {
      description:
        "The media item has associated streams, but has not found a valid torrent yet.",
    },
    UNKNOWN: {
      description: "The media item's state cannot be determined",
    },
    UNRELEASED: {
      description: "The media item has not yet been released.",
    },
  },
});
