import { z } from "zod";

import { WatchlistItem } from "./watchlist-item.schema.ts";

export const UserWatchlistResponse = z.object({
  MediaContainer: z.object({
    size: z.int(),
    totalSize: z.int(),
    Metadata: z.array(WatchlistItem).default([]),
  }),
});

export type UserWatchlistResponse = z.infer<typeof UserWatchlistResponse>;
