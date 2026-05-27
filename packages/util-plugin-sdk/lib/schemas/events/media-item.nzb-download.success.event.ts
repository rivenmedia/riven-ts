import z from "zod";

import { createEventHandlerSchema } from "../utilities/create-event-handler-schema.ts";
import { createProgramEventSchema } from "../utilities/create-program-event-schema.ts";
import { UUID } from "../utilities/uuid.schema.ts";

/**
 * Event emitted when an NZB download has completed successfully and the file
 * has been placed at the expected altmount path.
 * `altmountId` identifies the altmount entry so downstream workers can locate
 * the file without re-querying the download client.
 */
export const MediaItemNzbDownloadSuccessEvent = createProgramEventSchema(
  "media-item.nzb-download.success",
  z.object({
    itemId: UUID,
    altmountId: z.string().min(1),
  }),
);

export type MediaItemNzbDownloadSuccessEvent = z.infer<
  typeof MediaItemNzbDownloadSuccessEvent
>;

/** Handler for the nzb-download.success event. No response value (fire-and-forget). */
export const MediaItemNzbDownloadSuccessEventHandler = createEventHandlerSchema(
  MediaItemNzbDownloadSuccessEvent,
);
