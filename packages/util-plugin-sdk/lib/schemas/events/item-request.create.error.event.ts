import z from "zod";

import { ItemRequest } from "../media/item-request.ts";
import { createEventHandlerSchema } from "../utilities/create-event-handler-schema.ts";
import { createProgramEventErrorSchema } from "../utilities/create-program-event-error-schema.ts";
import { createProgramEventError } from "../utilities/create-program-event-error.ts";

/**
 * Event emitted when there was an error creating an item request.
 */
export const ItemRequestCreateErrorEvent = createProgramEventErrorSchema(
  "item-request.create",
  z.object({
    item: ItemRequest.transform(({ id, ...data }) => ({ ...data })).pipe(
      ItemRequest.omit({ id: true }),
    ),
    error: z.unknown(),
  }),
);

export type ItemRequestCreateErrorEvent = z.infer<
  typeof ItemRequestCreateErrorEvent
>;

export const ItemRequestCreateErrorEventHandler = createEventHandlerSchema(
  ItemRequestCreateErrorEvent,
);

export class ItemRequestCreateError extends createProgramEventError(
  ItemRequestCreateErrorEvent,
) {}
