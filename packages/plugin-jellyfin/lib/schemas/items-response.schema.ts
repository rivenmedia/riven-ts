import z from "zod";

export const ItemsResponse = z.object({
  Items: z.array(
    z.object({
      Id: z.string(),
      Path: z.string().nullish(),
    }),
  ),
});

export type ItemsResponse = z.infer<typeof ItemsResponse>;
