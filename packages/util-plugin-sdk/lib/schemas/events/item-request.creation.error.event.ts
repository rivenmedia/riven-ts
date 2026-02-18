import z from "zod";

import { ItemRequest } from "../media/item-request.ts";
import { createEventHandlerSchema } from "../utilities/create-event-handler-schema.ts";
import { createProgramEventError } from "../utilities/create-program-event-error.ts";
import { createProgramEventSchema } from "../utilities/create-program-event-schema.ts";

/**
 * Event emitted when there was an error creating an item request.
 */
export const ItemRequestCreationErrorEvent = createProgramEventSchema(
  "item-request.creation.error",
  z.object({
    item: ItemRequest.transform(({ id, ...data }) => ({ ...data })).pipe(
      ItemRequest.omit({ id: true }),
    ),
    error: z.unknown(),
  }),
);

export type ItemRequestCreationErrorEvent = z.infer<
  typeof ItemRequestCreationErrorEvent
>;

export const ItemRequestCreationErrorEventHandler = createEventHandlerSchema(
  ItemRequestCreationErrorEvent,
);

export class ItemRequestCreationError extends createProgramEventError(
  ItemRequestCreationErrorEvent,
) {}
