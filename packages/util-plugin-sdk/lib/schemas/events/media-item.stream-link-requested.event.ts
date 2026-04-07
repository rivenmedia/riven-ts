import z from "zod";

import { createEventHandlerSchema } from "../utilities/create-event-handler-schema.ts";
import { createProgramEventSchema } from "../utilities/create-program-event-schema.ts";

/**
 * Event emitted when a stream link has been requested for a media item.
 */
export const MediaItemStreamLinkRequestedEvent = await createProgramEventSchema(
  "media-item.stream-link.requested",
  async () => {
    const { MediaEntryInstance } =
      await import("../media/media-entry-instance.ts");

    return z.object({
      item: MediaEntryInstance,
    });
  },
);

export type MediaItemStreamLinkRequestedEvent = z.infer<
  typeof MediaItemStreamLinkRequestedEvent
>;

export const MediaItemStreamLinkRequestedResponse = z.object({
  link: z.url(),
});

export type MediaItemStreamLinkRequestedResponse = z.infer<
  typeof MediaItemStreamLinkRequestedResponse
>;

export const MediaItemStreamLinkRequestedEventHandler =
  createEventHandlerSchema(
    MediaItemStreamLinkRequestedEvent,
    MediaItemStreamLinkRequestedResponse,
  );
