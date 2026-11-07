import z from "zod";

export const ShowContentRatings = z.object({
  results: z.array(
    z.object({
      iso_3166_1: z.string(),
      rating: z.string(),
    }),
  ),
});
