import { z } from "zod";

import { WatchlistItem } from "./watchlist-item.schema.ts";

export const RSSWatchlistResponse = z.object({
  items: z.array(
    z
      .object({
        title: z.string().min(1),
        category: z.enum(["movie", "show"]),
        guids: z.array(z.string()),
      })
      .transform(({ guids, category, title }) =>
        WatchlistItem.parse({
          title,
          year: null,
          type: category,
          Guid: guids,
        }),
      ),
  ),
});

export type RSSWatchlistResponse = z.infer<typeof RSSWatchlistResponse>;
