import { z } from "zod";

import { Guid } from "./guid.schema.ts";

export const RSSWatchlistResponse = z.object({
  items: z.array(
    z
      .object({
        title: z.string().min(1),
        category: z.enum(["movie", "show"]),
        guids: z.array(Guid),
      })
      .transform(({ guids, category, title }) => ({
        title,
        year: null,
        type: category,
        Guid: guids,
      })),
  ),
});

export type RSSWatchlistResponse = z.infer<typeof RSSWatchlistResponse>;
