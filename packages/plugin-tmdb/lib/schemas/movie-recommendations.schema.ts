import z from "zod";

import { createPagedResponseSchema } from "./create-paged-response-schema.ts";

export const MovieRecommendations = createPagedResponseSchema(
  z.object({
    adult: z.boolean(),
    backdrop_path: z.string().nullable(),
    id: z.int(),
    title: z.string(),
    original_title: z.string(),
    overview: z.string(),
    poster_path: z.string().nullable(),
    media_type: z.string(),
    original_language: z.string(),
    genre_ids: z.array(z.int()),
    popularity: z.number(),
    release_date: z.iso.date(),
    softcore: z.boolean(),
    video: z.boolean(),
    vote_average: z.number(),
    vote_count: z.int(),
  }),
);
