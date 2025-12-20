import { z } from "zod";

const baseListItemSchema = z.object({
  id: z.number(),
  rank: z.number(),
  adult: z.union([z.literal(0), z.literal(1)]),
  imdb_id: z.string(),
  title: z.string(),
  release_year: z.number(),
});

export const movieSchema = z
  .object({
    mediatype: z.literal("movie"),
    tvdbid: z.null(),
  })
  .extend(baseListItemSchema.shape);

export type Movie = z.infer<typeof movieSchema>;

export const showSchema = z
  .object({
    mediatype: z.literal("show"),
    tvdbid: z.number().positive().nullable(),
  })
  .extend(baseListItemSchema.shape);

export type Show = z.infer<typeof showSchema>;

export const listItemSchema = z.discriminatedUnion("mediatype", [
  movieSchema,
  showSchema,
]);

export type ListItem = z.infer<typeof listItemSchema>;

export const customListSchema = z.array(listItemSchema);

export type CustomList = z.infer<typeof customListSchema>;
