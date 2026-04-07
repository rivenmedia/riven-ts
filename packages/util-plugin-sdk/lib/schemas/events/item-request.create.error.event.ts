import z from "zod";

import { ItemRequest } from "../media/item-request.ts";
import { createEventHandlerSchema } from "../utilities/create-event-handler-schema.ts";
import { createProgramEventError } from "../utilities/create-program-event-error.ts";
import { createProgramEventSchema } from "../utilities/create-program-event-schema.ts";

/**
 * Event emitted when there was an error creating an item request.
 */
export const ItemRequestCreateErrorEvent = await createProgramEventSchema(
  "item-request.create.error",
  () =>
    z.object({
      item: ItemRequest.transform(({ id, ...data }) => ({ ...data })).pipe(
        ItemRequest.omit({ id: true }),
      ),
      error: z.unknown(),
    }),
);

export type ItemRequestCreateErrorEvent = z.infer<
  typeof ItemRequestCreateErrorEvent
>;

export const ItemRequestCreateErrorEventHandler = createEventHandlerSchema(
  ItemRequestCreateErrorEvent,
);

export class ItemRequestCreateError extends createProgramEventError(
  ItemRequestCreateErrorEvent,
) {}
