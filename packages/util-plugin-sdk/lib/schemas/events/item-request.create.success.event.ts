import { type } from "arktype";

import { ItemRequestInstance } from "../media/item-request.ts";
import { createEventHandlerSchema } from "../utilities/create-event-handler-schema.ts";
import { createProgramEventSchema } from "../utilities/create-program-event-schema.ts";

/**
 * Event emitted when a new media item has been created from a requested item.
 */
export const ItemRequestCreateSuccessEvent = createProgramEventSchema(
  "item-request.create.success",
  type({
    item: ItemRequestInstance,
  }),
);

export type ItemRequestCreateSuccessEvent =
  typeof ItemRequestCreateSuccessEvent.infer;

export const ItemRequestCreateSuccessEventHandler = createEventHandlerSchema(
  ItemRequestCreateSuccessEvent,
);
