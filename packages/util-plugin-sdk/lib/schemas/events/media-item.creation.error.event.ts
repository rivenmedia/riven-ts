import z from "zod";

import { requestedItemSchema } from "../media-item/requested-item.ts";
import { createEventHandlerSchema } from "../utilities/create-event-handler-schema.ts";
import { createProgramEventSchema } from "../utilities/create-program-event-schema.ts";

/**
 * Event emitted when there was an error creating a media item from a requested item.
 */
export const MediaItemCreationErrorEvent = createProgramEventSchema(
  "media-item.creation.error",
  z.object({
    item: requestedItemSchema,
    error: z.unknown(),
  }),
);

export type MediaItemCreationErrorEvent = z.infer<
  typeof MediaItemCreationErrorEvent
>;

export const MediaItemCreationErrorEventHandler = createEventHandlerSchema(
  MediaItemCreationErrorEvent,
);
