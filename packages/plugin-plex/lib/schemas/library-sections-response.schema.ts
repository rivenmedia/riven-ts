import z from "zod";

import { librarySectionSchema } from "../__generated__/zod/librarySectionSchema.ts";

export const LibrarySectionsResponse = z.object({
  MediaContainer: z
    .object({
      Directory: z
        .array(librarySectionSchema.pick({ Location: true, key: true }))
        .optional(),
    })
    .optional(),
});

export type LibrarySectionsResponse = z.infer<typeof LibrarySectionsResponse>;
