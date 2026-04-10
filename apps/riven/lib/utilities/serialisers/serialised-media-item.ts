import { MediaItemInstance } from "@repo/util-plugin-sdk/schemas/media/media-item-instance";

import z from "zod";

import { database } from "../../database/database.ts";

/**
 * A schema that converts to/from a serialised media item.
 */
export const SerialisedMediaItem = z.codec(z.uuidv4(), MediaItemInstance, {
  decode: (id) => database.mediaItem.findOneOrFail(id),
  encode: (data, ctx) => {
    if (!data.id) {
      ctx.issues.push({
        code: "invalid_type",
        expected: "MediaItemInstance with an ID",
        received: "MediaItemInstance without an ID",
        input: data,
      });

      return z.NEVER;
    }

    if (typeof data.id !== "string") {
      ctx.issues.push({
        code: "invalid_type",
        expected: "MediaItemInstance with a string ID",
        received: `MediaItemInstance with a non-string ID of type ${typeof data.id}`,
        input: data,
      });

      return z.NEVER;
    }

    return data.id;
  },
});

export type SerialisedMediaItem = z.infer<typeof SerialisedMediaItem>;
