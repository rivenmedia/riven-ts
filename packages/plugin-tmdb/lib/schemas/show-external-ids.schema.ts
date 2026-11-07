import z from "zod";

export const ShowExternalIds = z.object({
  imdb_id: z.string().nullish(),
  tvdb_id: z.int().nullish(),
});

export type ShowExternalIds = z.infer<typeof ShowExternalIds>;
