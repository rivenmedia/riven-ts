import z from "zod";

import { MediaEntry } from "../../dto/entities/index.ts";
import { createEventHandlerSchema } from "../utilities/create-event-handler-schema.ts";
import { createProgramEventSchema } from "../utilities/create-program-event-schema.ts";

/**
 * Event emitted when a stream link has been requested for a media item.
 */
export const MediaItemStreamLinkRequestedEvent = createProgramEventSchema(
  "media-item.stream-link.requested",
  z.object({
    item: z.instanceof(MediaEntry),
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
