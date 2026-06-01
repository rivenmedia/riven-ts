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

/**
 * A single completed media file resolved over WebDAV. A movie or single
 * episode yields one; a season pack yields one per episode file.
 */
export const NzbResolvedFile = z.object({
  /**
   * WebDAV URL the file is streamable from, with credentials embedded as
   * userinfo. riven stores it as the MediaEntry's stream URL.
   */
  streamUrl: z.url(),
  /** Size of the file in bytes. */
  fileSize: z.number().int().nonnegative(),
  /** Filename of the file (basename of the WebDAV path). */
  originalFilename: z.string().min(1),
});

export type NzbResolvedFile = z.infer<typeof NzbResolvedFile>;

export const MediaItemNzbDownloadRequestedResponse = z.object({
  altmountId: z.string().min(1),
  status: z.enum(["queued", "downloading", "completed", "failed"]),
  /**
   * The completed media file(s). Present once `status` is `"completed"`: one
   * entry for a movie/episode, one per episode file for a season pack.
   */
  files: z.array(NzbResolvedFile).optional(),
});

export type MediaItemNzbDownloadRequestedResponse = z.infer<
  typeof MediaItemNzbDownloadRequestedResponse
>;

export const MediaItemNzbDownloadRequestedEventHandler =
  createEventHandlerSchema(
    MediaItemNzbDownloadRequestedEvent,
    MediaItemNzbDownloadRequestedResponse,
  );
