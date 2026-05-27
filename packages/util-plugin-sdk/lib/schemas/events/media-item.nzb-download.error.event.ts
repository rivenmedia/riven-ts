import z from "zod";

import { createEventHandlerSchema } from "../utilities/create-event-handler-schema.ts";
import { createProgramEventSchema } from "../utilities/create-program-event-schema.ts";
import { UUID } from "../utilities/uuid.schema.ts";

/**
 * Event emitted when an NZB download attempt has failed.
 * `reason` classifies the failure so downstream workers can route accordingly:
 *   - "addurl-failed"      — the download client rejected the NZB URL
 *   - "poll-timeout"       — the download did not complete within the allowed window
 *   - "altmount-failed"    — the file appeared but could not be mounted at the altmount path
 *   - "incorrect-state"    — the media item is in a state that cannot receive an NZB download
 * `detail` is an optional human-readable message for logging / alerting.
 */
export const MediaItemNzbDownloadErrorEvent = createProgramEventSchema(
  "media-item.nzb-download.error",
  z.object({
    itemId: UUID,
    reason: z.enum([
      "addurl-failed",
      "poll-timeout",
      "altmount-failed",
      "incorrect-state",
    ]),
    detail: z.string().optional(),
  }),
);

export type MediaItemNzbDownloadErrorEvent = z.infer<
  typeof MediaItemNzbDownloadErrorEvent
>;

/** Handler for the nzb-download.error event. No response value (fire-and-forget). */
export const MediaItemNzbDownloadErrorEventHandler = createEventHandlerSchema(
  MediaItemNzbDownloadErrorEvent,
);
