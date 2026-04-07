import z from "zod";

import { ItemRequest } from "../media/item-request.ts";
import { createEventHandlerSchema } from "../utilities/create-event-handler-schema.ts";
import { createProgramEventError } from "../utilities/create-program-event-error.ts";
import { createProgramEventSchema } from "../utilities/create-program-event-schema.ts";

/**
 * Event emitted when a requested media item already exists in the library.
 */
export const ItemRequestCreateErrorConflictEvent =
  await createProgramEventSchema("item-request.create.error.conflict", () =>
    z.object({
      item: ItemRequest,
    }),
  );

export type ItemRequestCreateErrorConflictEvent = z.infer<
  typeof ItemRequestCreateErrorConflictEvent
>;

export const ItemRequestCreateErrorConflictEventHandler =
  createEventHandlerSchema(ItemRequestCreateErrorConflictEvent);

export class ItemRequestCreateErrorConflict extends createProgramEventError(
  ItemRequestCreateErrorConflictEvent,
) {}
