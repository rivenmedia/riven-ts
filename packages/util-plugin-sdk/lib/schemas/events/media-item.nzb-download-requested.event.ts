import z from "zod";

import { createEventHandlerSchema } from "../utilities/create-event-handler-schema.ts";
import { createProgramEventSchema } from "../utilities/create-program-event-schema.ts";
import { NzbScrapeMediaItemPayload } from "./media-item.nzb-scrape-requested.event.ts";

/**
 * Event emitted when an NZB download has been requested for a specific candidate URL.
 * Used by the altmount/NZB pipeline to hand off a chosen NZB to a download plugin.
 */
export const MediaItemNzbDownloadRequestedEvent = createProgramEventSchema(
  "media-item.nzb-download.requested",
  z.object({
    item: NzbScrapeMediaItemPayload,
    nzbUrl: z.url(),
    expectedTitle: z.string().min(1),
  }),
);

export type MediaItemNzbDownloadRequestedEvent = z.infer<
  typeof MediaItemNzbDownloadRequestedEvent
>;

export const MediaItemNzbDownloadRequestedResponse = z.object({
  altmountId: z.string().min(1),
  status: z.enum(["queued", "downloading", "completed", "failed"]),
});

export type MediaItemNzbDownloadRequestedResponse = z.infer<
  typeof MediaItemNzbDownloadRequestedResponse
>;

export const MediaItemNzbDownloadRequestedEventHandler =
  createEventHandlerSchema(
    MediaItemNzbDownloadRequestedEvent,
    MediaItemNzbDownloadRequestedResponse,
  );
