import { MediaItemInstance } from "@repo/util-plugin-sdk/schemas/media/media-item-instance";

import { type } from "arktype";

import { database } from "../../database/database.ts";
import { createCodec } from "./create-codec.ts";

/**
 * A schema that converts to/from a serialised media item.
 */
export const SerialisedMediaItem = createCodec(
  type("number.integer > 0"),
  MediaItemInstance,
  {
    decode: (data) => database.mediaItem.findOneOrFail(data),
    encode: (data) => data.id,
  },
);

export type SerialisedMediaItem = typeof SerialisedMediaItem;
