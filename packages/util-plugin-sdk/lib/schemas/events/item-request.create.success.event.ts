import z from "zod";

import { ItemRequestInstance } from "../media/item-request-instance.ts";
import { createEventHandlerSchema } from "../utilities/create-event-handler-schema.ts";
import { createProgramEventSchema } from "../utilities/create-program-event-schema.ts";

/**
 * Event emitted when a new media item has been created from a requested item.
 */
export const ItemRequestCreateSuccessEvent = createProgramEventSchema(
  "item-request.create.success",
  z.object({
    item: ItemRequestInstance,
  }),
);

export type ItemRequestCreateSuccessEvent = z.infer<
  typeof ItemRequestCreateSuccessEvent
>;

export const ItemRequestCreateSuccessEventHandler = createEventHandlerSchema(
  ItemRequestCreateSuccessEvent,
);
