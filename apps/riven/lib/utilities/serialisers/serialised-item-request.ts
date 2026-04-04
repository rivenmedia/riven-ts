import { ItemRequestInstance } from "@repo/util-plugin-sdk/schemas/media/item-request";

import { type } from "arktype";

import { database } from "../../database/database.ts";
import { createCodec } from "./create-codec.ts";

/**
 * A schema that converts to/from a serialised item request.
 */
export const SerialisedItemRequest = createCodec(
  type("number.integer > 0"),
  ItemRequestInstance,
  {
    decode: (id) => database.itemRequest.findOneOrFail(id),
    encode: (data) => data.id,
  },
);

export type SerialisedItemRequest = typeof SerialisedItemRequest;
