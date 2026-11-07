import z from "zod";

import { createPagedResponseSchema } from "./create-paged-response-schema.ts";

/**
 * The show shape returned by TMDB's paged TV list endpoints (trending, recommendations, similar).
 */
export const ShowListItem = z.object({
  id: z.int(),
  name: z.string(),
  overview: z.string(),
  backdrop_path: z.string().nullable(),
  poster_path: z.string().nullable(),
  original_language: z.string(),
  genre_ids: z.array(z.int()),
  first_air_date: z.string().nullish(),
  origin_country: z.array(z.string()).nullish(),
});

export type ShowListItem = z.infer<typeof ShowListItem>;

export const ShowListResponse = createPagedResponseSchema(ShowListItem);
