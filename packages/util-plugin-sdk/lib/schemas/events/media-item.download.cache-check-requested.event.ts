import { type } from "arktype";

import { DebridFile } from "../torrents/debrid-file.ts";
import { createEventHandlerSchema } from "../utilities/create-event-handler-schema.ts";
import { createProgramEventSchema } from "../utilities/create-program-event-schema.ts";

/**
 * Event emitted when a cache check has been requested for an infohash before attempting a download.
 */
export const MediaItemDownloadCacheCheckRequestedEvent =
  createProgramEventSchema(
    "media-item.download.cache-check-requested",
    type({
      infoHashes: "(string.hex == 40)[] > 0",
      provider: "string | null",
    }),
  );

export type MediaItemDownloadCacheCheckRequestedEvent =
  typeof MediaItemDownloadCacheCheckRequestedEvent.infer;

export const MediaItemDownloadCacheCheckRequestedResponse = z.record(
  z.hash("sha1"),
  z.array(DebridFile),
);

export type MediaItemDownloadCacheCheckRequestedResponse = z.infer<
  typeof MediaItemDownloadCacheCheckRequestedResponse
>;

export const MediaItemDownloadCacheCheckRequestedEventHandler =
  createEventHandlerSchema(
    MediaItemDownloadCacheCheckRequestedEvent,
    MediaItemDownloadCacheCheckRequestedResponse,
  );
