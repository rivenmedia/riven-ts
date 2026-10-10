import z from "zod";

import { ItemRequest } from "#schemas/media/item-request.ts";
import { createEventHandlerSchema } from "#schemas/utilities/create-event-handler-schema.ts";
import { createProgramEventErrorSchema } from "#schemas/utilities/create-program-event-error-schema.ts";
import { createProgramEventError } from "#schemas/utilities/create-program-event-error.ts";

/**
 * Event emitted when a media item being indexed has already been indexed.
 */
export const MediaItemIndexErrorIncorrectStateEvent =
  createProgramEventErrorSchema(
    ["media-item.index", "incorrect-state"],
    z.object({
      item: ItemRequest,
    }),
  );

export type MediaItemIndexErrorIncorrectStateEvent = z.infer<
  typeof MediaItemIndexErrorIncorrectStateEvent
>;

export const MediaItemIndexErrorIncorrectStateEventHandler =
  createEventHandlerSchema(MediaItemIndexErrorIncorrectStateEvent);

export class MediaItemIndexErrorIncorrectState extends createProgramEventError(
  MediaItemIndexErrorIncorrectStateEvent,
) {}
