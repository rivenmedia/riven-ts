import { z } from "zod";

import { Guid } from "./guid.schema.ts";

export const UserWatchlistResponse = z.object({
  MediaContainer: z.object({
    size: z.int(),
    totalSize: z.int(),
    Metadata: z.array(
      z.object({
        title: z.string().min(1),
        year: z.int(),
        type: z.enum(["movie", "show"]),
        Guid: z.array(Guid),
      }),
    ),
  }),
});

export type UserWatchlistResponse = z.infer<typeof UserWatchlistResponse>;
