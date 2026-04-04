import { type } from "arktype";

import { ItemRequest as ItemRequestEntity } from "../../dto/entities/index.ts";
import { ItemRequestType } from "../../dto/enums/item-request-type.enum.ts";

export const ItemRequest = type({
  id: "number.integer",
  "imdbId?": "string | null",
  "tmdbId?": "string | null",
  "tvdbId?": "string | null",
  type: ItemRequestType,
  externalRequestId: "string?",
  requestedBy: "string | null",
  "seasons?": "number.integer[] | null",
});

export const ItemRequestInstance = type.instanceOf(ItemRequestEntity);

export type ItemRequestInstance = typeof ItemRequestInstance.infer;
