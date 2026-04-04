import { type } from "arktype";

import { MediaEntryInstance } from "../media/media-entry-instance.ts";
import { createEventHandlerSchema } from "../utilities/create-event-handler-schema.ts";
import { createProgramEventSchema } from "../utilities/create-program-event-schema.ts";

/**
 * Event emitted when a stream link has been requested for a media item.
 */
export const MediaItemStreamLinkRequestedEvent = createProgramEventSchema(
  "media-item.stream-link.requested",
  type({
    item: MediaEntryInstance,
  }),
);

export type MediaItemStreamLinkRequestedEvent =
  typeof MediaItemStreamLinkRequestedEvent.infer;

export const MediaItemStreamLinkRequestedResponse = type({
  link: "string.url",
});

export type MediaItemStreamLinkRequestedResponse =
  typeof MediaItemStreamLinkRequestedResponse.infer;

export const MediaItemStreamLinkRequestedEventHandler =
  createEventHandlerSchema(
    MediaItemStreamLinkRequestedEvent,
    MediaItemStreamLinkRequestedResponse,
  );
