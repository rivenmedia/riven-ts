import z from "zod";

import { ItemRequestInstance } from "#schemas/media/item-request-instance.ts";
import { createEventHandlerSchema } from "#schemas/utilities/create-event-handler-schema.ts";
import { createProgramEventSchema } from "#schemas/utilities/create-program-event-schema.ts";

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
