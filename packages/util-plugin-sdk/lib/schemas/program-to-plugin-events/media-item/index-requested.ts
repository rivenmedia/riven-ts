import z from "zod";

import { mediaItemStateSchema } from "../../../dto/entities/index.ts";
import { requestedItemSchema } from "../../media-item/requested-item.ts";
import { createEventHandlerSchema } from "../../utilities/create-event-handler-schema.ts";
import { createProgramEventSchema } from "../../utilities/create-program-event-schema.ts";

/**
 * Event emitted when a new media item has been created from a requested item.
 */
export const MediaItemIndexRequestedEvent = createProgramEventSchema(
  "media-item.index.requested",
  z.object({
    item: requestedItemSchema.extend({
      id: z.number(),
      state: mediaItemStateSchema.extract(["Requested"]),
    }),
  }),
);

export type MediaItemIndexRequestedEvent = z.infer<
  typeof MediaItemIndexRequestedEvent
>;

export const MediaItemIndexRequestedResponse = z.object({
  item: z.object({
    id: z.number(),
    title: z.string(),
    genres: z.array(z.string()),
    country: z.string().nullish(),
    rating: z.number().nullish(),
    contentRating: z.string().nullish(),
    aliases: z.record(z.string(), z.array(z.string())).nullish(),
    posterUrl: z.url().nullish(),
    releaseDate: z.union([z.iso.date().nullish(), z.literal("")]),
    language: z.string().nullish(),
  }),
});

export type MediaItemIndexRequestedResponse = z.infer<
  typeof MediaItemIndexRequestedResponse
>;

export const MediaItemIndexRequestedEventHandler = createEventHandlerSchema(
  MediaItemIndexRequestedEvent,
  MediaItemIndexRequestedResponse,
);
