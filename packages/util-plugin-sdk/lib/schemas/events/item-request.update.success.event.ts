import z from "zod";

import { createEventHandlerSchema } from "../utilities/create-event-handler-schema.ts";
import { createProgramEventSchema } from "../utilities/create-program-event-schema.ts";

/**
 * Event emitted when an item request has been successfully updated.
 */
export const ItemRequestUpdateSuccessEvent = createProgramEventSchema(
  "item-request.update.success",
  z.object({
    itemId: z.string().min(1),
  }),
);

export type ItemRequestUpdateSuccessEvent = z.infer<
  typeof ItemRequestUpdateSuccessEvent
>;

export const ItemRequestUpdateSuccessEventHandler = createEventHandlerSchema(
  ItemRequestUpdateSuccessEvent,
);
