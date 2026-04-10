import { ItemRequestInstance } from "@repo/util-plugin-sdk/schemas/media/item-request-instance";

import z from "zod";

import { database } from "../../database/database.ts";

/**
 * A schema that converts to/from a serialised item request.
 */
export const SerialisedItemRequest = z.codec(z.uuidv4(), ItemRequestInstance, {
  decode: (id) => database.itemRequest.findOneOrFail(id),
  encode: (data, ctx) => {
    if (!data.id) {
      ctx.issues.push({
        code: "invalid_type",
        expected: "ItemRequestInstance with an ID",
        received: "ItemRequestInstance without an ID",
        input: data,
      });

      return z.NEVER;
    }

    if (typeof data.id !== "string") {
      ctx.issues.push({
        code: "invalid_type",
        expected: "ItemRequestInstance with a string ID",
        received: `ItemRequestInstance with a non-string ID of type ${typeof data.id}`,
        input: data,
      });

      return z.NEVER;
    }

    return data.id;
  },
});

export type SerialisedItemRequest = z.infer<typeof SerialisedItemRequest>;
