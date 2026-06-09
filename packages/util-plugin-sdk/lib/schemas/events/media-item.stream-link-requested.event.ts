import z from "zod";

import { MediaEntryInstance } from "../media/media-entry-instance.ts";
import { createEventHandlerSchema } from "../utilities/create-event-handler-schema.ts";
import { createProgramEventSchema } from "../utilities/create-program-event-schema.ts";

/**
 * Event emitted when a stream link has been requested for a media item.
 */
export const MediaItemStreamLinkRequestedEvent = createProgramEventSchema(
  "media-item.stream-link.requested",
  z.object({
    item: MediaEntryInstance,
  }),
);

export type MediaItemStreamLinkRequestedEvent = z.infer<
  typeof MediaItemStreamLinkRequestedEvent
>;

export const MediaItemStreamLinkRequestedResponse = z.discriminatedUnion(
  "success",
  [
    z.object({
      success: z.literal(true),
      data: z.intersection(
        z.object({
          link: z.url(),
        }),
        z.discriminatedUnion("isPermalink", [
          z.object({
            isPermalink: z.literal(true),
          }),
          z.object({
            isPermalink: z.literal(false),
            expiresAt: z.iso
              .datetime()
              .describe(
                "The expiry date for this stream link; once expired, a new link will be requested.",
              ),
          }),
        ]),
      ),
    }),
    z.object({
      success: z.literal(false),
      statusCode: z.int().positive(),
    }),
  ],
);

export type MediaItemStreamLinkRequestedResponse = z.infer<
  typeof MediaItemStreamLinkRequestedResponse
>;

export const MediaItemStreamLinkRequestedEventHandler =
  createEventHandlerSchema(
    MediaItemStreamLinkRequestedEvent,
    MediaItemStreamLinkRequestedResponse,
  );
