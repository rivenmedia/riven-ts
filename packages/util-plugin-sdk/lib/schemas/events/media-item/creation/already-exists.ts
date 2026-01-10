import z from "zod";

import { requestedItemSchema } from "../../../media-item/requested-item.ts";
import { createEventHandlerSchema } from "../../../utilities/create-event-handler-schema.ts";
import { createProgramEventSchema } from "../../../utilities/create-program-event-schema.ts";

/**
 * Event emitted when a requested media item already exists in the library.
 */
export const MediaItemCreationAlreadyExistsEvent = createProgramEventSchema(
  "media-item.creation.already-exists",
  z.object({
    item: requestedItemSchema.extend({
      id: z.number(),
      title: z.string().nullish(),
    }),
  }),
);

export type MediaItemCreationAlreadyExistsEvent = z.infer<
  typeof MediaItemCreationAlreadyExistsEvent
>;

export const MediaItemCreationAlreadyExistsEventHandler =
  createEventHandlerSchema(MediaItemCreationAlreadyExistsEvent);
