import z from "zod";

import { ItemRequest } from "../media/requested-item.ts";
import { createEventHandlerSchema } from "../utilities/create-event-handler-schema.ts";
import { createProgramEventSchema } from "../utilities/create-program-event-schema.ts";

/**
 * Event emitted when there was an error creating a media item from a requested item.
 */
export const MediaItemCreationErrorEvent = createProgramEventSchema(
  "media-item.creation.error",
  z.object({
    item: ItemRequest.omit({ id: true }),
    error: z.unknown(),
  }),
);

export type MediaItemCreationErrorEvent = z.infer<
  typeof MediaItemCreationErrorEvent
>;

export const MediaItemCreationErrorEventHandler = createEventHandlerSchema(
  MediaItemCreationErrorEvent,
);
