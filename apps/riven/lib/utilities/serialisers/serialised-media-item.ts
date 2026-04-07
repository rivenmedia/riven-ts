import { MediaItemInstance } from "@repo/util-plugin-sdk/schemas/media/media-item-instance";

import z from "zod";

import { database } from "../../database/database.ts";

/**
 * A schema that converts to/from a serialised media item.
 */
export const SerialisedMediaItem = z.codec(z.uuidv4(), MediaItemInstance, {
  decode: (data) => database.mediaItem.findOneOrFail(data),
  encode: (data) => data.id,
});

export type SerialisedMediaItem = z.infer<typeof SerialisedMediaItem>;
