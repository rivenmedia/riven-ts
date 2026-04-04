import { type } from "arktype";

import { MediaItemInstance } from "../media/media-item-instance.ts";
import { createEventHandlerSchema } from "../utilities/create-event-handler-schema.ts";
import { createProgramEventError } from "../utilities/create-program-event-error.ts";
import { createProgramEventSchema } from "../utilities/create-program-event-schema.ts";

/**
 * Event emitted when a media item download fails.
 */
export const MediaItemDownloadErrorEvent = createProgramEventSchema(
  "media-item.download.error",
  type({
    item: MediaItemInstance,
    error: "unknown",
  }),
);

export type MediaItemDownloadErrorEvent =
  typeof MediaItemDownloadErrorEvent.infer;

export const MediaItemDownloadErrorEventHandler = createEventHandlerSchema(
  MediaItemDownloadErrorEvent,
);

export class MediaItemDownloadError extends createProgramEventError(
  MediaItemDownloadErrorEvent,
) {}
