import z from "zod";

import { ItemRequestInstance } from "../media/item-request-instance.ts";
import { createEventHandlerSchema } from "../utilities/create-event-handler-schema.ts";
import { createProgramEventErrorSchema } from "../utilities/create-program-event-error-schema.ts";
import { createProgramEventError } from "../utilities/create-program-event-error.ts";

/**
 * Event emitted when there was an error persisting media item index data.
 */
export const MediaItemIndexErrorEvent = createProgramEventErrorSchema(
  "media-item.index",
  z.object({
    item: ItemRequestInstance,
    error: z.unknown(),
  }),
);

export type MediaItemIndexErrorEvent = z.infer<typeof MediaItemIndexErrorEvent>;

export const MediaItemIndexErrorEventHandler = createEventHandlerSchema(
  MediaItemIndexErrorEvent,
);

export class MediaItemIndexError extends createProgramEventError(
  MediaItemIndexErrorEvent,
) {}
