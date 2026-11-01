import z from "zod";

import { createPagedResponseSchema } from "./create-paged-response-schema.ts";
import { ShowListItem } from "./show-list-item.schema.ts";

/**
 * The response of `search/multi`.
 *
 * The generated schema only describes movie fields, so it strips the `name` and `first_air_date` of shows.
 */
export const SearchMultiResponse = createPagedResponseSchema(
  z.discriminatedUnion("media_type", [
    z.object({
      media_type: z.literal("movie"),
      id: z.int(),
      title: z.string(),
      overview: z.string().optional(),
      backdrop_path: z.string().nullish(),
      poster_path: z.string().nullish(),
      original_language: z.string().optional(),
      genre_ids: z.array(z.int()).optional(),
      release_date: z.string().optional(),
    }),
    ShowListItem.extend({ media_type: z.literal("tv") }),
    z.object({ media_type: z.literal("person") }),
  ]),
);

export type SearchMultiResponse = z.infer<typeof SearchMultiResponse>;
