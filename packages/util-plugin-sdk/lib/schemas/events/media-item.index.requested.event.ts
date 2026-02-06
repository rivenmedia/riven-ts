import z from "zod";

import { MediaItemContentRating } from "../../dto/enums/content-ratings.enum.ts";
import { MediaItem } from "../media/media-item.ts";
import { createEventHandlerSchema } from "../utilities/create-event-handler-schema.ts";
import { createProgramEventSchema } from "../utilities/create-program-event-schema.ts";

/**
 * Event emitted when an index has been requested for a newly created media item.
 */
export const MediaItemIndexRequestedEvent = createProgramEventSchema(
  "media-item.index.requested",
  z.object({
    item: MediaItem,
  }),
);

export type MediaItemIndexRequestedEvent = z.infer<
  typeof MediaItemIndexRequestedEvent
>;

const IndexedItem = z.object({
  id: z.number(),
  title: z.string(),
  genres: z.array(z.string()),
  country: z.string().nullish(),
  rating: z.number().nullish(),
  contentRating: MediaItemContentRating.nullish(),
  aliases: z.record(z.string(), z.array(z.string())).nullish(),
  posterUrl: z.url().nullish(),
  language: z.string().nullish(),
  year: z.number().nullish(),
});

export const MediaItemIndexRequestedResponse = z
  .object({
    item: z.discriminatedUnion("type", [
      IndexedItem.extend({
        type: z.literal("show"),
        airedAt: z.iso.date().nullish(),
        network: z.string().min(1).nullable(),
        seasons: z.array(
          z.object({
            number: z.number(),
            year: z.number(),
            episodes: z.array(
              z.object({
                number: z.number(),
                year: z.number(),
                title: z.string(),
                posterPath: z.url().nullish(),
                airedAt: z.iso.date().nullish(),
              }),
            ),
          }),
        ),
      }),
      IndexedItem.extend({
        type: z.literal("movie"),
        releaseDate: z.iso.date().nullish(),
      }),
    ]),
  })
  .nullable()
  .describe(
    "The indexed media item data, or null if no indexing was performed",
  );

export type MediaItemIndexRequestedResponse = z.infer<
  typeof MediaItemIndexRequestedResponse
>;

export const MediaItemIndexRequestedEventHandler = createEventHandlerSchema(
  MediaItemIndexRequestedEvent,
  MediaItemIndexRequestedResponse,
);
