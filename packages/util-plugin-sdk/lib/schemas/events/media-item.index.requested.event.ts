import z from "zod";

import {
  MovieContentRating,
  ShowContentRating,
} from "../../dto/enums/content-ratings.enum.ts";
import { ShowStatus } from "../../dto/enums/show-status.enum.ts";
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
  aliases: z.record(z.string(), z.array(z.string())).nullish(),
  posterUrl: z.url().nullish(),
  language: z.string().nullish(),
  imdbId: z.string().nullable(),
});

export const MediaItemIndexRequestedResponse = z
  .object({
    item: z.discriminatedUnion("type", [
      IndexedItem.extend({
        type: z.literal("show"),
        contentRating: z.string().default("Unknown").pipe(ShowContentRating),
        firstAired: z.iso.date(),
        network: z.string().min(1).nullable(),
        status: ShowStatus,
        seasons: z.array(
          z.object({
            number: z.number(),
            episodes: z.array(
              z.object({
                contentRating: z
                  .string()
                  .default("Unknown")
                  .pipe(ShowContentRating)
                  .nullable(),
                number: z.number(),
                title: z.string(),
                posterPath: z.url().nullish(),
                airedAt: z.iso.date().nullish(),
                runtime: z.int().positive().nullable(),
              }),
            ),
          }),
        ),
      }),
      IndexedItem.extend({
        type: z.literal("movie"),
        releaseDate: z.iso.date().nullish(),
        contentRating: z.string().default("Unknown").pipe(MovieContentRating),
      }),
    ]),
  })
  .nullable()
  .describe(
    "The indexed media item data, or null if no indexing was performed",
  );

export type MediaItemIndexRequestedPluginResponse = z.input<
  typeof MediaItemIndexRequestedResponse
>;

export type MediaItemIndexRequestedResponse = z.infer<
  typeof MediaItemIndexRequestedResponse
>;

export const MediaItemIndexRequestedEventHandler = createEventHandlerSchema(
  MediaItemIndexRequestedEvent,
  MediaItemIndexRequestedResponse,
);
