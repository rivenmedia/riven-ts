import z from "zod";

import { ItemRequestInstance } from "../media/item-request.ts";
import { createEventHandlerSchema } from "../utilities/create-event-handler-schema.ts";
import { createProgramEventSchema } from "../utilities/create-program-event-schema.ts";

/**
 * Event emitted when a new media item has been created from a requested item.
 */
export const ItemRequestCreationSuccessEvent = createProgramEventSchema(
  "item-request.creation.success",
  z.object({
    item: ItemRequestInstance,
  }),
);

export type ItemRequestCreationSuccessEvent = z.infer<
  typeof ItemRequestCreationSuccessEvent
>;

export const ItemRequestCreationSuccessEventHandler = createEventHandlerSchema(
  ItemRequestCreationSuccessEvent,
);
