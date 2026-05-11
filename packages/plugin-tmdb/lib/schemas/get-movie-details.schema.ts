import { movieDetails200Schema } from "../__generated__/zod/movieDetailsSchema.ts";
import { movieExternalIds200Schema } from "../__generated__/zod/movieExternalIdsSchema.ts";

import type z from "zod";

export const GetMovieDetails = movieDetails200Schema.extend({
  external_ids: movieExternalIds200Schema,
});

export type GetMovieDetails = z.infer<typeof GetMovieDetails>;
