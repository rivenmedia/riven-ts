import z from "zod";

import { requestedItemSchema } from "../../../media-item/requested-item.ts";
import { createEventHandlerSchema } from "../../../utilities/create-event-handler-schema.ts";
import { createProgramEventSchema } from "../../../utilities/create-program-event-schema.ts";

/**
 * Event emitted when there was an error persisting media item index data.
 */
export const MediaItemIndexErrorEvent = createProgramEventSchema(
  "media-item.index.error",
  z.object({
    item: requestedItemSchema.extend({
      id: z.number(),
      title: z.string().nullish(),
    }),
    error: z.unknown(),
  }),
);

export type MediaItemIndexErrorEvent = z.infer<typeof MediaItemIndexErrorEvent>;

export const MediaItemIndexErrorEventHandler = createEventHandlerSchema(
  MediaItemIndexErrorEvent,
);
