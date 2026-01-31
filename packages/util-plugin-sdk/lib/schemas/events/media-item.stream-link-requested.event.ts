import z from "zod";

import { SerialisedMediaEntry } from "../media-item/serialised-media-entry.ts";
import { createEventHandlerSchema } from "../utilities/create-event-handler-schema.ts";
import { createProgramEventSchema } from "../utilities/create-program-event-schema.ts";

/**
 * Event emitted when a stream link has been requested for a media item.
 */
export const MediaItemStreamLinkRequestedEvent = createProgramEventSchema(
  "media-item.stream-link.requested",
  z.object({
    item: SerialisedMediaEntry,
  }),
);

export type MediaItemStreamLinkRequestedEvent = z.infer<
  typeof MediaItemStreamLinkRequestedEvent
>;

export const MediaItemStreamLinkRequestedResponse = z.object({
  url: z.url(),
});

export type MediaItemStreamLinkRequestedResponse = z.infer<
  typeof MediaItemStreamLinkRequestedResponse
>;

export const MediaItemStreamLinkRequestedEventHandler =
  createEventHandlerSchema(
    MediaItemStreamLinkRequestedEvent,
    MediaItemStreamLinkRequestedResponse,
  );
