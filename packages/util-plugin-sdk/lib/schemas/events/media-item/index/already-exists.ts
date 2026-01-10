import z from "zod";

import { requestedItemSchema } from "../../../media-item/requested-item.ts";
import { createEventHandlerSchema } from "../../../utilities/create-event-handler-schema.ts";
import { createProgramEventSchema } from "../../../utilities/create-program-event-schema.ts";

/**
 * Event emitted when a media item being indexed has already been indexed.
 */
export const MediaItemIndexAlreadyExistsEvent = createProgramEventSchema(
  "media-item.index.already-exists",
  z.object({
    item: requestedItemSchema.extend({
      id: z.number(),
      title: z.string().nullish(),
    }),
  }),
);

export type MediaItemIndexAlreadyExistsEvent = z.infer<
  typeof MediaItemIndexAlreadyExistsEvent
>;

export const MediaItemIndexAlreadyExistsEventHandler = createEventHandlerSchema(
  MediaItemIndexAlreadyExistsEvent,
);
