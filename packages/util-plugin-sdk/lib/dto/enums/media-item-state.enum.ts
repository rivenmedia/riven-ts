import { registerEnumType } from "type-graphql";
import z from "zod";

export const MediaItemState = z.enum([
  "unknown",
  "unreleased",
  "ongoing",
  "indexed",
  "scraped",
  "downloaded",
  "completed",
  "partially_completed",
  "failed",
  "paused",
]);

export type MediaItemState = z.infer<typeof MediaItemState>;

registerEnumType(MediaItemState.enum, {
  name: "MediaItemState",
  description: "The state of a media item in the processing pipeline.",
  valuesConfig: {
    completed: {
      description:
        "The media item has been fully processed and is available to be streamed.",
    },
    downloaded: {
      description:
        "The media item has been downloaded, but still requires post-processing.",
    },
    failed: {
      description: "The media item has failed.",
    },
    indexed: {
      description:
        "The media item has pulled information from its respective database (TMDB for movies, TVDB for shows).",
    },
    ongoing: {
      description:
        "The media item is still being released, and will require periodic re-indexing. Does not apply to movies or episodes.",
    },
    partially_completed: {
      description:
        "The media item was unable to complete processing for all items, and may retry in the future. Does not apply to movies.",
    },
    paused: {
      description: "The media item has paused its processing.",
    },
    scraped: {
      description:
        "The media item has associated streams, but has not found a valid torrent yet.",
    },
    unknown: {
      description: "The media item's state cannot be determined",
    },
    unreleased: {
      description: "The media item has not yet been released.",
    },
  },
});
