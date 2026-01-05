import z from "zod";

import { requestedItemSchema } from "../../../media-item/requested-item.ts";
import { createEventHandlerSchema } from "../../../utilities/create-event-handler-schema.ts";
import { createProgramEventSchema } from "../../../utilities/create-program-event-schema.ts";

/**
 * Event emitted when a new media item has been created from a requested item.
 */
export const MediaItemCreationSuccessEvent = createProgramEventSchema(
  "media-item.creation.success",
  z.object({
    item: requestedItemSchema.extend({
      id: z.number(),
    }),
  }),
);

export type MediaItemCreationSuccessEvent = z.infer<
  typeof MediaItemCreationSuccessEvent
>;

export const MediaItemCreationSuccessEventHandler = createEventHandlerSchema(
  MediaItemCreationSuccessEvent,
);
