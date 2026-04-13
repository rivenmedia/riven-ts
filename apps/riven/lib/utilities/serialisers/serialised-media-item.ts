import {
  Episode,
  MediaItem,
  Movie,
  Season,
  Show,
} from "@repo/util-plugin-sdk/dto/entities";
import { UUID } from "@repo/util-plugin-sdk/schemas/utilities/uuid.schema";

import z from "zod";

import { database } from "../../database/database.ts";
import { createApolloInstanceSchema } from "./create-apollo-instance-schema.ts";

/**
 * A schema that converts to/from a serialised media item.
 */
export const SerialisedMediaItem = z.codec(
  UUID,
  z.xor([
    z.instanceof(MediaItem),
    createApolloInstanceSchema(MediaItem, Movie, Show, Season, Episode),
  ]),
  {
    decode: (id) => database.mediaItem.findOneOrFail(id),
    encode: (data) => UUID.parse(data.id),
  },
);

export type SerialisedMediaItem = z.infer<typeof SerialisedMediaItem>;
