import z from "zod";

import { createEventHandlerSchema } from "../utilities/create-event-handler-schema.ts";
import { createProgramEventSchema } from "../utilities/create-program-event-schema.ts";
import { MediaItemIndexRequestedEvent } from "./media-item.index.requested.event.ts";

/**
 * Event emitted when there was an error persisting media item index data.
 */
export const MediaItemIndexErrorEvent = createProgramEventSchema(
  "media-item.index.error",
  z.object({
    item: MediaItemIndexRequestedEvent.shape.item,
    error: z.unknown(),
  }),
);

export type MediaItemIndexErrorEvent = z.infer<typeof MediaItemIndexErrorEvent>;

export const MediaItemIndexErrorEventHandler = createEventHandlerSchema(
  MediaItemIndexErrorEvent,
);
