import z from "zod";

import { ItemRequest } from "../media/item-request.ts";
import { createEventHandlerSchema } from "../utilities/create-event-handler-schema.ts";
import { createProgramEventError } from "../utilities/create-program-event-error.ts";
import { createProgramEventSchema } from "../utilities/create-program-event-schema.ts";

/**
 * Event emitted when a requested media item already exists in the library.
 */
export const ItemRequestCreationErrorConflictEvent = createProgramEventSchema(
  "item-request.creation.error.conflict",
  z.object({
    item: ItemRequest,
  }),
);

export type ItemRequestCreationErrorConflictEvent = z.infer<
  typeof ItemRequestCreationErrorConflictEvent
>;

export const ItemRequestCreationErrorConflictEventHandler =
  createEventHandlerSchema(ItemRequestCreationErrorConflictEvent);

export class ItemRequestCreationErrorConflict extends createProgramEventError(
  ItemRequestCreationErrorConflictEvent,
) {}
