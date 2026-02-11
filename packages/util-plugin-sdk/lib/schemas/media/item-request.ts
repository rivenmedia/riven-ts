import z from "zod";

import {
  ItemRequest as ItemRequestEntity,
  RequestType,
} from "../../dto/entities/index.ts";

export const ItemRequest = z.object({
  id: z.int(),
  imdbId: z.string().nullish(),
  tmdbId: z.string().nullish(),
  tvdbId: z.string().nullish(),
  type: RequestType,
});

export const ItemRequestInstance = z.instanceof(ItemRequestEntity);

export type ItemRequestInstance = z.infer<typeof ItemRequestInstance>;
