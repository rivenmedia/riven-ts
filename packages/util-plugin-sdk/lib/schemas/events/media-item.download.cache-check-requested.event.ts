import z from "zod";

import { CachedTorrent } from "../torrents/cached-torrent.ts";
import { createEventHandlerSchema } from "../utilities/create-event-handler-schema.ts";
import { createProgramEventSchema } from "../utilities/create-program-event-schema.ts";

/**
 * Event emitted when a cache check has been requested for an infohash before attempting a download.
 */
export const MediaItemDownloadCacheCheckRequestedEvent =
  createProgramEventSchema(
    "media-item.download.cache-check-requested",
    z.object({
      infoHash: z.hash("sha1"),
    }),
  );

export type MediaItemDownloadCacheCheckRequestedEvent = z.infer<
  typeof MediaItemDownloadCacheCheckRequestedEvent
>;

export const MediaItemDownloadCacheCheckRequestedResponse =
  CachedTorrent.nullable();

export type MediaItemDownloadCacheCheckRequestedResponse = z.infer<
  typeof MediaItemDownloadCacheCheckRequestedResponse
>;

export const MediaItemDownloadCacheCheckRequestedEventHandler =
  createEventHandlerSchema(
    MediaItemDownloadCacheCheckRequestedEvent,
    MediaItemDownloadCacheCheckRequestedResponse,
  );
