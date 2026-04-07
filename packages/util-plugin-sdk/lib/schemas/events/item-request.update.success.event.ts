import z from "zod";

import { createEventHandlerSchema } from "../utilities/create-event-handler-schema.ts";
import { createProgramEventSchema } from "../utilities/create-program-event-schema.ts";

/**
 * Event emitted when an item request has been successfully updated.
 */
export const ItemRequestUpdateSuccessEvent = await createProgramEventSchema(
  "item-request.update.success",
  async () => {
    const { ItemRequestInstance } = await import("../media/item-request.ts");

    return z.object({
      item: ItemRequestInstance,
    });
  },
);

export type ItemRequestUpdateSuccessEvent = z.infer<
  typeof ItemRequestUpdateSuccessEvent
>;

export const ItemRequestUpdateSuccessEventHandler = createEventHandlerSchema(
  ItemRequestUpdateSuccessEvent,
);
