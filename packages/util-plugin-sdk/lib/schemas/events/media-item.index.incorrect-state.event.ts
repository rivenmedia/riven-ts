import { type } from "arktype";

import { ItemRequest } from "../media/item-request.ts";
import { createEventHandlerSchema } from "../utilities/create-event-handler-schema.ts";
import { createProgramEventError } from "../utilities/create-program-event-error.ts";
import { createProgramEventSchema } from "../utilities/create-program-event-schema.ts";

/**
 * Event emitted when a media item being indexed has already been indexed.
 */
export const MediaItemIndexErrorIncorrectStateEvent = createProgramEventSchema(
  "media-item.index.error.incorrect-state",
  type({
    item: ItemRequest,
  }),
);

export type MediaItemIndexErrorIncorrectStateEvent =
  typeof MediaItemIndexErrorIncorrectStateEvent.infer;

export const MediaItemIndexErrorIncorrectStateEventHandler =
  createEventHandlerSchema(MediaItemIndexErrorIncorrectStateEvent);

export class MediaItemIndexErrorIncorrectState extends createProgramEventError(
  MediaItemIndexErrorIncorrectStateEvent,
) {}
