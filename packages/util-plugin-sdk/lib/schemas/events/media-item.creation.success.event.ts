import z from "zod";

import { SerialisedMediaItem } from "../media-item/serialised-media-item.ts";
import { createEventHandlerSchema } from "../utilities/create-event-handler-schema.ts";
import { createProgramEventSchema } from "../utilities/create-program-event-schema.ts";

/**
 * Event emitted when a new media item has been created from a requested item.
 */
export const MediaItemCreationSuccessEvent = createProgramEventSchema(
  "media-item.creation.success",
  z.object({
    item: SerialisedMediaItem,
  }),
);

export type MediaItemCreationSuccessEvent = z.infer<
  typeof MediaItemCreationSuccessEvent
>;

export const MediaItemCreationSuccessEventHandler = createEventHandlerSchema(
  MediaItemCreationSuccessEvent,
);
