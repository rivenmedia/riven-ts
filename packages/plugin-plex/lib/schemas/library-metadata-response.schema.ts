import { z } from "zod";

export const LibraryMetadataResponse = z.object({
  MediaContainer: z.object({
    Metadata: z
      .array(
        z.object({
          ratingKey: z.string(),
          Location: z.array(z.object({ path: z.string() })).optional(),
          Media: z
            .array(
              z.object({
                Part: z.array(z.object({ file: z.string() })).optional(),
              }),
            )
            .optional(),
        }),
      )
      .optional(),
  }),
});

export type LibraryMetadataResponse = z.infer<typeof LibraryMetadataResponse>;
