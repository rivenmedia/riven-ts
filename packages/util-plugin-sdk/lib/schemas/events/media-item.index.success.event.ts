import { type } from "arktype";

import { MovieInstance } from "../media/movie-instance.ts";
import { ShowInstance } from "../media/show-instance.ts";
import { createEventHandlerSchema } from "../utilities/create-event-handler-schema.ts";
import { createProgramEventSchema } from "../utilities/create-program-event-schema.ts";

/**
 * Event emitted when a media item's state has been updated.
 */
export const MediaItemIndexSuccessEvent = createProgramEventSchema(
  "media-item.index.success",
  type({
    item: MovieInstance.or(ShowInstance),
  }),
);

export type MediaItemIndexSuccessEvent =
  typeof MediaItemIndexSuccessEvent.infer;

export const MediaItemIndexSuccessEventHandler = createEventHandlerSchema(
  MediaItemIndexSuccessEvent,
);
