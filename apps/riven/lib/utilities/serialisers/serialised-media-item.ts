import { MediaItemType } from "@repo/util-plugin-sdk/dto/entities";
import { MediaItemInstance } from "@repo/util-plugin-sdk/schemas/media/media-item";

import { wrap } from "@mikro-orm/core";
import z from "zod";

import { database } from "../../database/database.ts";

/**
 * A schema that converts to/from a serialised MediaItem.
 */
export const SerialisedMediaItem = z.codec(
  z.looseObject({ type: MediaItemType }),
  MediaItemInstance,
  {
    decode: (data) => {
      switch (data.type) {
        case "movie": {
          return database.movie.create(
            {
              ...data,
              type: "movie",
            },
            {
              persist: false,
              partial: true,
              managed: true,
            },
          );
        }
        case "show":
          return database.show.create(
            {
              ...data,
              type: "show",
            },
            {
              persist: false,
              partial: true,
              managed: true,
            },
          );
        case "season":
          return database.season.create(
            {
              ...data,
              type: "season",
            },
            {
              persist: false,
              partial: true,
              managed: true,
            },
          );
        case "episode":
          return database.episode.create(
            {
              ...data,
              type: "episode",
            },
            {
              persist: false,
              partial: true,
              managed: true,
            },
          );
      }
    },
    encode: (data) => wrap(data).serialize(),
  },
);

export type SerialisedMediaItem = z.infer<typeof SerialisedMediaItem>;
