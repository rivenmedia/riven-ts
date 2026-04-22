import { MediaItem } from "@repo/util-plugin-sdk/dto/entities";
import { UUID } from "@repo/util-plugin-sdk/schemas/utilities/uuid.schema";

import z from "zod";

import { services } from "../../database/database.ts";
import { createApolloInstanceSchema } from "./create-apollo-instance-schema.ts";

/**
 * A schema that converts to/from a serialised media item.
 */
export const SerialisedMediaItem = z.codec(
  UUID,
  z.xor([z.instanceof(MediaItem), createApolloInstanceSchema(MediaItem)]),
  {
    decode: (id) => services.mediaItemService.getMediaItem(id),
    encode: (data) => UUID.parse(data.id),
  },
);

export type SerialisedMediaItem = z.infer<typeof SerialisedMediaItem>;
