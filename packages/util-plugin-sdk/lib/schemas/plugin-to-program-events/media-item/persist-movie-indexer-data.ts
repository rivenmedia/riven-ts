import z from "zod";

import { createPluginEventSchema } from "../../utilities/create-plugin-event-schema.ts";

/**
 * Event emitted when a plugin has provided data to be persisted for a media item after indexing a movie.
 */
export const MediaItemPersistMovieIndexerDataEvent = createPluginEventSchema(
  "media-item.persist-movie-indexer-data",
  z.object({
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
  }),
);

export type MediaItemPersistMovieIndexerDataEvent = z.infer<
  typeof MediaItemPersistMovieIndexerDataEvent
>;
