import z from "zod";

import { MediaItem } from "../../dto/entities/index.ts";
import { createEventHandlerSchema } from "../utilities/create-event-handler-schema.ts";
import { createProgramEventSchema } from "../utilities/create-program-event-schema.ts";

/**
 * Event emitted when a media item being indexed has already been indexed.
 */
export const MediaItemIndexErrorIncorrectStateEvent = createProgramEventSchema(
  "media-item.index.error.incorrect-state",
  z.object({
    item: z.instanceof(MediaItem),
  }),
);

export type MediaItemIndexErrorIncorrectStateEvent = z.infer<
  typeof MediaItemIndexErrorIncorrectStateEvent
>;

export const MediaItemIndexErrorIncorrectStateEventHandler =
  createEventHandlerSchema(MediaItemIndexErrorIncorrectStateEvent);
