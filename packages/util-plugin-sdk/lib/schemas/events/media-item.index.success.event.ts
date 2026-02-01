import z from "zod";

import { MediaItem } from "../../dto/entities/index.ts";
import { createEventHandlerSchema } from "../utilities/create-event-handler-schema.ts";
import { createProgramEventSchema } from "../utilities/create-program-event-schema.ts";

/**
 * Event emitted when a media item's state has been updated.
 */
export const MediaItemIndexSuccessEvent = createProgramEventSchema(
  "media-item.index.success",
  z.object({
    item: z.instanceof(MediaItem),
  }),
);

export type MediaItemIndexSuccessEvent = z.infer<
  typeof MediaItemIndexSuccessEvent
>;

export const MediaItemIndexSuccessEventHandler = createEventHandlerSchema(
  MediaItemIndexSuccessEvent,
);
