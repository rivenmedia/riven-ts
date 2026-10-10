import z from "zod";

import { DebridFile } from "#schemas/torrents/debrid-file.ts";
import { createEventHandlerSchema } from "#schemas/utilities/create-event-handler-schema.ts";
import { createProgramEventSchema } from "#schemas/utilities/create-program-event-schema.ts";

/**
 * Event emitted when a cache check has been requested for an infohash before attempting a download.
 */
export const MediaItemDownloadCacheCheckRequestedEvent =
  createProgramEventSchema(
    "media-item.download.cache-check-requested",
    z.object({
      infoHashes: z.array(z.hash("sha1")).min(1),
      provider: z.string().nullable(),
    }),
  );

export type MediaItemDownloadCacheCheckRequestedEvent = z.infer<
  typeof MediaItemDownloadCacheCheckRequestedEvent
>;

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
