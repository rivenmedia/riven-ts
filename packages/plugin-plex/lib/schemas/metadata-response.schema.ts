import z from "zod";

export const MetadataResponse = z.object({
  MediaContainer: z.object({
    Metadata: z.array(
      z.object({
        type: z.string(),
        ratingKey: z.string(),
        Guid: z.array(
          z.object({
            id: z.string(),
          }),
        ),
      }),
    ),
  }),
});

export type MetadataResponse = z.infer<typeof MetadataResponse>;
