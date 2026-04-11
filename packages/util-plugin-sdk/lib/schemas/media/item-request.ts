import z from "zod";

import { ItemRequestType } from "../../dto/enums/item-request-type.enum.ts";
import { UUID } from "../utilities/uuid.schema.ts";

export const ItemRequest = z.object({
  id: UUID,
  imdbId: z.string().nullish(),
  tmdbId: z.string().nullish(),
  tvdbId: z.string().nullish(),
  type: ItemRequestType,
  externalRequestId: z.string().optional(),
  requestedBy: z.string().nullish(),
  seasons: z.array(z.number().nonnegative()).min(1).nullish(),
});
