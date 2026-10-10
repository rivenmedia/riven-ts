import z from "zod";

import { MediaItemInstance } from "#schemas/media/media-item-instance.ts";
import { createEventHandlerSchema } from "#schemas/utilities/create-event-handler-schema.ts";
import { createProgramEventErrorSchema } from "#schemas/utilities/create-program-event-error-schema.ts";
import { createProgramEventError } from "#schemas/utilities/create-program-event-error.ts";

/**
 * Event emitted when a media item download fails.
 */
export const MediaItemDownloadErrorEvent = createProgramEventErrorSchema(
  "media-item.download",
  z.object({
    item: MediaItemInstance,
    error: z.unknown(),
  }),
);

export type MediaItemDownloadErrorEvent = z.infer<
  typeof MediaItemDownloadErrorEvent
>;

export const MediaItemDownloadErrorEventHandler = createEventHandlerSchema(
  MediaItemDownloadErrorEvent,
);

export class MediaItemDownloadError extends createProgramEventError(
  MediaItemDownloadErrorEvent,
) {}
