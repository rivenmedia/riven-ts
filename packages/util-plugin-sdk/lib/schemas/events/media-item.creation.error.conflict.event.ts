import z from "zod";

import { ItemRequest } from "../media/item-request.ts";
import { createEventHandlerSchema } from "../utilities/create-event-handler-schema.ts";
import { createProgramEventSchema } from "../utilities/create-program-event-schema.ts";

/**
 * Event emitted when a requested media item already exists in the library.
 */
export const MediaItemCreationErrorConflictEvent = createProgramEventSchema(
  "media-item.creation.error.conflict",
  z.object({
    item: ItemRequest,
  }),
);

export type MediaItemCreationErrorConflictEvent = z.infer<
  typeof MediaItemCreationErrorConflictEvent
>;

export const MediaItemCreationErrorConflictEventHandler =
  createEventHandlerSchema(MediaItemCreationErrorConflictEvent);
