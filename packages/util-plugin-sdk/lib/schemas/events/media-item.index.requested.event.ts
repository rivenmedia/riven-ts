import z from "zod";

import {
  MovieContentRating,
  ShowContentRating,
} from "../../dto/enums/content-ratings.enum.ts";
import { ShowStatus } from "../../dto/enums/show-status.enum.ts";
import { createEventHandlerSchema } from "../utilities/create-event-handler-schema.ts";
import { createProgramEventSchema } from "../utilities/create-program-event-schema.ts";

/**
 * Event emitted when an index has been requested for a newly created media item.
 */
export const MediaItemIndexRequestedEvent = await createProgramEventSchema(
  "media-item.index.requested",
  async () => {
    const { ItemRequestInstance } = await import("../media/item-request.ts");

    return z.object({
      item: ItemRequestInstance,
    });
  },
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

const ReleaseDatetime = z.iso.datetime({ precision: -1 });

export const MediaItemIndexRequestedResponse = z
  .object({
    item: z.discriminatedUnion("type", [
      IndexedItem.extend({
        type: z.literal("show"),
        contentRating: ShowContentRating,
        network: z.string().min(1).nullable(),
        status: ShowStatus,
        seasons: z.record(
          z.int(),
          z.object({
            number: z.number(),
            title: z.string().nullable(),
            episodes: z.array(
              z.object({
                contentRating: ShowContentRating,
                absoluteNumber: z.int().nonnegative(),
                number: z.int().nonnegative(),
                title: z.string(),
                posterPath: z.url().nullish(),
                airedAt: ReleaseDatetime.nullable(),
                runtime: z.int().positive().nullable(),
              }),
            ),
          }),
        ),
      }),
      IndexedItem.extend({
        type: z.literal("movie"),
        releaseDate: ReleaseDatetime.nullable(),
        contentRating: MovieContentRating,
        runtime: z.int().positive().nullable(),
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
