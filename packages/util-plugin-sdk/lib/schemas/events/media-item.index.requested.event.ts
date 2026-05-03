import z from "zod";

import {
  MovieContentRating,
  ShowContentRating,
} from "../../dto/enums/content-ratings.enum.ts";
import { ShowStatus } from "../../dto/enums/show-status.enum.ts";
import { ItemRequestInstance } from "../media/item-request-instance.ts";
import { createEventHandlerSchema } from "../utilities/create-event-handler-schema.ts";
import { createProgramEventSchema } from "../utilities/create-program-event-schema.ts";
import { UUID } from "../utilities/uuid.schema.ts";

/**
 * Event emitted when an index has been requested for a newly created movie.
 */
export const MediaItemIndexRequestedMovieEvent = createProgramEventSchema(
  "media-item.index.requested.movie",
  z.object({
    item: ItemRequestInstance,
  }),
);

export type MediaItemIndexRequestedMovieEvent = z.infer<
  typeof MediaItemIndexRequestedMovieEvent
>;

/**
 * Event emitted when an index has been requested for a newly created show.
 */
export const MediaItemIndexRequestedShowEvent = createProgramEventSchema(
  "media-item.index.requested.show",
  z.object({
    item: ItemRequestInstance,
  }),
);

export type MediaItemIndexRequestedShowEvent = z.infer<
  typeof MediaItemIndexRequestedShowEvent
>;

const IndexedItem = z.object({
  id: UUID,
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

export const MediaItemIndexRequestedMovieResponse = z
  .object({
    item: IndexedItem.extend({
      type: z.literal("movie"),
      releaseDate: ReleaseDatetime.nullable(),
      contentRating: MovieContentRating,
      runtime: z.int().nonnegative().nullable(),
    }),
  })
  .nullable()
  .describe(
    "The indexed media item data, or null if no indexing was performed",
  );

export type MediaItemIndexRequestedMovieResponse = z.infer<
  typeof MediaItemIndexRequestedMovieResponse
>;

export const MediaItemIndexRequestedShowResponse = z
  .object({
    item: IndexedItem.extend({
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
              runtime: z.int().nonnegative().nullable(),
            }),
          ),
        }),
      ),
    }),
  })
  .nullable()
  .describe(
    "The indexed media item data, or null if no indexing was performed",
  );

export type MediaItemIndexRequestedShowResponse = z.infer<
  typeof MediaItemIndexRequestedShowResponse
>;

export const MediaItemIndexRequestedMovieEventHandler =
  createEventHandlerSchema(
    MediaItemIndexRequestedMovieEvent,
    MediaItemIndexRequestedMovieResponse,
  );

export const MediaItemIndexRequestedShowEventHandler = createEventHandlerSchema(
  MediaItemIndexRequestedShowEvent,
  MediaItemIndexRequestedShowResponse,
);
