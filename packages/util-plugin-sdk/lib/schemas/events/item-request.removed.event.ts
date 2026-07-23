import z from "zod";

import { ItemRequest } from "../media/item-request.ts";
import { createEventHandlerSchema } from "../utilities/create-event-handler-schema.ts";
import { createProgramEventSchema } from "../utilities/create-program-event-schema.ts";

/**
 * Event emitted when an item request has been successfully removed.
 */
export const ItemRequestRemovedEvent = createProgramEventSchema(
  "item-request.removed",

  z.object({
    item: ItemRequest,
  }),
);

export type ItemRequestRemovedEvent = z.infer<typeof ItemRequestRemovedEvent>;

export const ItemRequestRemovedEventHandler = createEventHandlerSchema(
  ItemRequestRemovedEvent,
);
