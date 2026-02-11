import z from "zod";

import { RequestType } from "../../dto/entities/index.ts";

export const ItemRequest = z.object({
  id: z.int(),
  imdbId: z.string().nullish(),
  tmdbId: z.string().nullish(),
  tvdbId: z.string().nullish(),
  type: RequestType,
});

export type ItemRequest = z.infer<typeof ItemRequest>;
