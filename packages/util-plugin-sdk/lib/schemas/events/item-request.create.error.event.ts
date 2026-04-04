import { type } from "arktype";

import { ItemRequest } from "../media/item-request.ts";
import { createEventHandlerSchema } from "../utilities/create-event-handler-schema.ts";
import { createProgramEventError } from "../utilities/create-program-event-error.ts";
import { createProgramEventSchema } from "../utilities/create-program-event-schema.ts";

/**
 * Event emitted when there was an error creating an item request.
 */
export const ItemRequestCreateErrorEvent = createProgramEventSchema(
  "item-request.create.error",
  type({
    item: ItemRequest.pipe(({ id, ...data }) => ({ ...data })),
    error: "unknown",
  }),
);

export type ItemRequestCreateErrorEvent =
  typeof ItemRequestCreateErrorEvent.infer;

export const ItemRequestCreateErrorEventHandler = createEventHandlerSchema(
  ItemRequestCreateErrorEvent,
);

export class ItemRequestCreateError extends createProgramEventError(
  ItemRequestCreateErrorEvent,
) {}
