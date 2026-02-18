import z from "zod";

import { ItemRequest as ItemRequestEntity } from "../../dto/entities/index.ts";
import { ItemRequestType } from "../../dto/enums/item-request-type.enum.ts";

export const ItemRequest = z.object({
  id: z.int(),
  imdbId: z.string().nullish(),
  tmdbId: z.string().nullish(),
  tvdbId: z.string().nullish(),
  type: ItemRequestType,
  externalRequestId: z.string().optional(),
});

export const ItemRequestInstance = z.instanceof(ItemRequestEntity);

export type ItemRequestInstance = z.infer<typeof ItemRequestInstance>;
