import { ItemRequest } from "@repo/util-plugin-sdk/dto/entities";
import { UUID } from "@repo/util-plugin-sdk/schemas/utilities/uuid.schema";

import z from "zod";

import { database } from "../../database/database.ts";
import { createApolloInstanceSchema } from "./create-apollo-instance-schema.ts";

/**
 * A schema that converts to/from a serialised item request.
 */
export const SerialisedItemRequest = z.codec(
  UUID,
  z.xor([z.instanceof(ItemRequest), createApolloInstanceSchema(ItemRequest)]),
  {
    decode: (id) => database.itemRequest.findOneOrFail(id, { refresh: true }),
    encode: (data) => UUID.parse(data.id),
  },
);

export type SerialisedItemRequest = z.infer<typeof SerialisedItemRequest>;
