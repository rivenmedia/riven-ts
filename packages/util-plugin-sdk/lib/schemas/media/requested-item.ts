import z from "zod";

export const requestedItemSchema = z.object({
  imdbId: z.string().nullish(),
  tmdbId: z.string().nullish(),
  tvdbId: z.string().nullish(),
});

export type RequestedItem = z.infer<typeof requestedItemSchema>;
