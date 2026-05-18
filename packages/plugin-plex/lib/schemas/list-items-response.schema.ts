import z from "zod";

export const ListItemsResponse = z.object({
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
            metadataItems: z.object({
              pageInfo: z.object({
                hasNextPage: z.boolean(),
                endCursor: z.string().nullable(),
              }),
              nodes: z.array(
                z.object({
                  id: z.string(),
                  title: z.string(),
                  type: z.string(),
                  year: z.number().optional(),
                  guid: z.string().optional(),
                }),
              ),
            }),
          }),
        ),
      }),
    }),
  }),
});

export type ListItemsResponse = z.infer<typeof ListItemsResponse>;
