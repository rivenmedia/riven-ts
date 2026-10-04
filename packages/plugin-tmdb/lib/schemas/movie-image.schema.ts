import { z } from "zod";

export const MovieImage = z.object({
  aspect_ratio: z.number(),
  height: z.int(),
  iso_639_1: z.string().nullable(),
  file_path: z.string(),
  vote_average: z.number(),
  vote_count: z.number(),
  width: z.int(),
});

export type MovieImage = z.infer<typeof MovieImage>;
