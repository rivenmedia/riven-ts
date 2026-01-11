import z from "zod";

import { SerialisedMediaItem } from "../media-item/serialised-media-item.ts";
import { createEventHandlerSchema } from "../utilities/create-event-handler-schema.ts";
import { createProgramEventSchema } from "../utilities/create-program-event-schema.ts";

/**
 * Event emitted when an index has been requested for a newly created media item.
 */
export const MediaItemIndexRequestedEvent = createProgramEventSchema(
  "media-item.index.requested",
  z.object({
    item: SerialisedMediaItem,
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
