import z from "zod";

import { createPagedResponseSchema } from "./create-paged-response-schema.ts";

export const MovieSimilarItems = createPagedResponseSchema(
  z.object({
    adult: z.boolean(),
    backdrop_path: z.string(),
    genre_ids: z.array(z.int()),
    id: z.int(),
    title: z.string(),
    original_language: z.string(),
    original_title: z.string(),
    overview: z.string(),
    popularity: z.number(),
    poster_path: z.string(),
    release_date: z.string(),
    softcore: z.boolean().default(false),
    video: z.boolean(),
    vote_average: z.number(),
    vote_count: z.int(),
  }),
);
