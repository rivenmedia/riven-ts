import z from "zod";

export const requestedItemSchema = z.object({
  imdbId: z.string().optional(),
  tmdbId: z.string().optional(),
  tvdbId: z.string().optional(),
});

export type RequestedItem = z.infer<typeof requestedItemSchema>;
