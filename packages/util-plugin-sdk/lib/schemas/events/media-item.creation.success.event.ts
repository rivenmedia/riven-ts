import z from "zod";

import { MediaItem } from "../media/media-item.ts";
import { createEventHandlerSchema } from "../utilities/create-event-handler-schema.ts";
import { createProgramEventSchema } from "../utilities/create-program-event-schema.ts";

/**
 * Event emitted when a new media item has been created from a requested item.
 */
export const MediaItemCreationSuccessEvent = createProgramEventSchema(
  "media-item.creation.success",
  z.object({
    item: MediaItem,
  }),
);

export type MediaItemCreationSuccessEvent = z.infer<
  typeof MediaItemCreationSuccessEvent
>;

export const MediaItemCreationSuccessEventHandler = createEventHandlerSchema(
  MediaItemCreationSuccessEvent,
);
