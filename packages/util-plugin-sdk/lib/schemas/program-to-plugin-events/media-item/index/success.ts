import z from "zod";

import { requestedItemSchema } from "../../../media-item/requested-item.ts";
import { createEventHandlerSchema } from "../../../utilities/create-event-handler-schema.ts";
import { createProgramEventSchema } from "../../../utilities/create-program-event-schema.ts";

/**
 * Event emitted when a media item's state has been updated.
 */
export const MediaItemIndexSuccessEvent = createProgramEventSchema(
  "media-item.index.success",
  z.object({
    item: requestedItemSchema.extend({
      id: z.number(),
      title: z.string().nullish(),
    }),
  }),
);

export type MediaItemIndexSuccessEvent = z.infer<
  typeof MediaItemIndexSuccessEvent
>;

export const MediaItemIndexSuccessEventHandler = createEventHandlerSchema(
  MediaItemIndexSuccessEvent,
);
