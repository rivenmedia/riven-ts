import z from "zod";

import { ItemRequestInstance } from "#schemas/media/item-request-instance.ts";
import { createEventHandlerSchema } from "#schemas/utilities/create-event-handler-schema.ts";
import { createProgramEventSchema } from "#schemas/utilities/create-program-event-schema.ts";

/**
 * Event emitted when an item request has been successfully updated.
 */
export const ItemRequestUpdateSuccessEvent = createProgramEventSchema(
  "item-request.update.success",

  z.object({
    item: ItemRequestInstance,
  }),
);

export type ItemRequestUpdateSuccessEvent = z.infer<
  typeof ItemRequestUpdateSuccessEvent
>;

export const ItemRequestUpdateSuccessEventHandler = createEventHandlerSchema(
  ItemRequestUpdateSuccessEvent,
);
