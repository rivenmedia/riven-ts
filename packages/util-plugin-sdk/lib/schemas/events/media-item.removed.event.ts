import z from "zod";

import { createEventHandlerSchema } from "../utilities/create-event-handler-schema.ts";
import { createProgramEventSchema } from "../utilities/create-program-event-schema.ts";

/**
 * Event emitted when a media item and its files have been removed from the library.
 */
export const MediaItemRemovedEvent = createProgramEventSchema(
  "media-item.removed",
  z.object({
    title: z.string(),
    paths: z.array(z.string()),
  }),
);

export type MediaItemRemovedEvent = z.infer<typeof MediaItemRemovedEvent>;

export const MediaItemRemovedEventHandler = createEventHandlerSchema(
  MediaItemRemovedEvent,
);
