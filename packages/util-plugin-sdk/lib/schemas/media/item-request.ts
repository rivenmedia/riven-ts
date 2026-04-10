import z from "zod";

import { ItemRequestType } from "../../dto/enums/item-request-type.enum.ts";

export const ItemRequest = z.object({
  id: z.uuidv4(),
  imdbId: z.string().nullish(),
  tmdbId: z.string().nullish(),
  tvdbId: z.string().nullish(),
  type: ItemRequestType,
  externalRequestId: z.string().optional(),
  requestedBy: z.string().nullish(),
  seasons: z.array(z.number().nonnegative()).min(1).nullish(),
});
