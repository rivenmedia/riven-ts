import { MediaItemType } from "@repo/util-plugin-sdk/dto/entities";
import { MediaItem } from "@repo/util-plugin-sdk/schemas/media/media-item";

import { wrap } from "@mikro-orm/core";
import z from "zod";

import { database } from "../../database/database.ts";

/**
 * A schema that converts to/from a serialised MediaItem.
 */
export const SerialisedMediaItem = z.codec(
  // Just validate the input has a matching media item type here
  // to prevent non-media items from being passed through
  z.looseObject({ type: MediaItemType }),
  MediaItem,
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
        case "requested_item":
          return database.requestedItem.create(
            {
              ...data,
              type: "requested_item",
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
