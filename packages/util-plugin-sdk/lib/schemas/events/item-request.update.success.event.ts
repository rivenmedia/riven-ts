import { type } from "arktype";

import { ItemRequestInstance } from "../media/item-request.ts";
import { createEventHandlerSchema } from "../utilities/create-event-handler-schema.ts";
import { createProgramEventSchema } from "../utilities/create-program-event-schema.ts";

/**
 * Event emitted when an item request has been successfully updated.
 */
export const ItemRequestUpdateSuccessEvent = createProgramEventSchema(
  "item-request.update.success",
  type({
    item: ItemRequestInstance,
  }),
);

export type ItemRequestUpdateSuccessEvent =
  typeof ItemRequestUpdateSuccessEvent.infer;

export const ItemRequestUpdateSuccessEventHandler = createEventHandlerSchema(
  ItemRequestUpdateSuccessEvent,
);
