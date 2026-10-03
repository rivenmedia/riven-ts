import { z } from "zod";

import { Guid } from "./guid.schema.ts";

export const WatchlistItem = z.object({
  title: z.string().min(1),
  year: z.int().nullable(),
  type: z.enum(["movie", "show"]),
  Guid: z.array(Guid),
});

export type WatchlistItem = z.infer<typeof WatchlistItem>;
