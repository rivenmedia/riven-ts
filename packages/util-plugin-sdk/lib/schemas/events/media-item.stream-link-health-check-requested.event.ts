import z from "zod";

import { MediaEntryInstance } from "../media/media-entry-instance.ts";
import { createEventHandlerSchema } from "../utilities/create-event-handler-schema.ts";
import { createProgramEventSchema } from "../utilities/create-program-event-schema.ts";

/**
 * Event emitted when a stream link health check has been requested for a media item.
 */
export const MediaItemStreamLinkHealthCheckRequestedEvent =
  createProgramEventSchema(
    "media-item.stream-link.health-check.requested",
    z.object({
      item: MediaEntryInstance,
    }),
  );

export type MediaItemStreamLinkHealthCheckRequestedEvent = z.infer<
  typeof MediaItemStreamLinkHealthCheckRequestedEvent
>;

export const MediaItemStreamLinkHealthCheckRequestedResponse = z.object({
  healthy: z.boolean(),
});

export type MediaItemStreamLinkHealthCheckRequestedResponse = z.infer<
  typeof MediaItemStreamLinkHealthCheckRequestedResponse
>;

export const MediaItemStreamLinkHealthCheckRequestedEventHandler =
  createEventHandlerSchema(
    MediaItemStreamLinkHealthCheckRequestedEvent,
    MediaItemStreamLinkHealthCheckRequestedResponse,
  );
