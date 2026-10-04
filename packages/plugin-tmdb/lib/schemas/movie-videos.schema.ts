import z from "zod";

export const MovieVideos = z.object({
  id: z.int(),
  results: z.array(
    z.object({
      id: z.string(),
      iso_639_1: z.string(),
      iso_3166_1: z.string(),
      name: z.string(),
      key: z.string(),
      site: z.string(),
      size: z.int(),
      type: z.string(),
      official: z.boolean(),
      published_at: z.iso.datetime(),
    }),
  ),
});
