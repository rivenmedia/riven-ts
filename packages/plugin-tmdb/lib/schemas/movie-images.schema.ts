import { z } from "zod";

import { MovieImage } from "./movie-image.schema.ts";

export const MovieImages = z.object({
  id: z.int(),
  backdrops: z.array(MovieImage),
  logos: z.array(MovieImage),
  posters: z.array(MovieImage),
});
