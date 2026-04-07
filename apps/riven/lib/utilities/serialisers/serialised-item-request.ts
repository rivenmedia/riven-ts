import { ItemRequestInstance } from "@repo/util-plugin-sdk/schemas/media/item-request";

import z from "zod";

import { database } from "../../database/database.ts";

/**
 * A schema that converts to/from a serialised item request.
 */
export const SerialisedItemRequest = z.codec(z.uuidv4(), ItemRequestInstance, {
  decode: (id) => database.itemRequest.findOneOrFail(id),
  encode: (data) => data.id,
});

export type SerialisedItemRequest = z.infer<typeof SerialisedItemRequest>;
