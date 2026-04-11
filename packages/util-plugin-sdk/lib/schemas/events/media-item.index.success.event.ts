import z from "zod";

import { MovieInstance } from "../media/movie-instance.ts";
import { ShowInstance } from "../media/show-instance.ts";
import { createEventHandlerSchema } from "../utilities/create-event-handler-schema.ts";
import { createProgramEventSchema } from "../utilities/create-program-event-schema.ts";

/**
 * Event emitted when a media item has been successfully indexed.
 */
export const MediaItemIndexSuccessEvent = createProgramEventSchema(
  "media-item.index.success",
  z.object({
    item: z.xor([MovieInstance, ShowInstance]),
  }),
);

export type MediaItemIndexSuccessEvent = z.infer<
  typeof MediaItemIndexSuccessEvent
>;

export const MediaItemIndexSuccessEventHandler = createEventHandlerSchema(
  MediaItemIndexSuccessEvent,
);
