import z from "zod";

export const ListResponse = z.object({
  data: z.object({
    user: z.object({
      customLists: z.object({
        pageInfo: z.object({
          hasNextPage: z.boolean(),
          endCursor: z.string().nullable(),
        }),
        nodes: z.array(
          z.object({
            id: z.string(),
            name: z.string(),
            slug: z.string(),
            itemCount: z.number(),
          }),
        ),
      }),
    }),
  }),
});

export type ListResponse = z.infer<typeof ListResponse>;
