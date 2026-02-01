import z from "zod";

import { MediaItem } from "../../dto/entities/index.ts";
import { createEventHandlerSchema } from "../utilities/create-event-handler-schema.ts";
import { createProgramEventSchema } from "../utilities/create-program-event-schema.ts";

/**
 * Event emitted when a media item download fails.
 */
export const MediaItemDownloadErrorEvent = createProgramEventSchema(
  "media-item.download.error",
  z.object({
    item: z.instanceof(MediaItem),
    error: z.unknown(),
  }),
);

export type MediaItemDownloadErrorEvent = z.infer<
  typeof MediaItemDownloadErrorEvent
>;

export const MediaItemDownloadErrorEventHandler = createEventHandlerSchema(
  MediaItemDownloadErrorEvent,
);
