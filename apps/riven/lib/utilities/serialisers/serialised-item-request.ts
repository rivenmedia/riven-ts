import { RequestType } from "@repo/util-plugin-sdk/dto/entities";
import { ItemRequest } from "@repo/util-plugin-sdk/schemas/media/requested-item";

import z from "zod";

import { database } from "../../database/database.ts";

/**
 * A schema that converts to/from a serialised MediaItem.
 */
export const SerialisedItemRequest = z.codec(
  // Just validate the input has a matching media item type here
  // to prevent non-media items from being passed through
  z.looseObject({ type: RequestType }),
  ItemRequest,
  {
    decode: (data) =>
      database.itemRequest.create(data, {
        persist: false,
        partial: true,
        managed: true,
      }),
    encode: (data) => data,
  },
);

export type SerialisedItemRequest = z.infer<typeof SerialisedItemRequest>;
