import { database } from "@repo/core-util-database/database";
import {
  Episode,
  MediaItemType,
  Movie,
  RequestedItem,
  Season,
  Show,
} from "@repo/util-plugin-sdk/dto/entities/index";

import { wrap } from "@mikro-orm/core";
import z from "zod";

export const SerialisedMediaItem = z.codec(
  // Just validate the input has a matching media item type here
  // to prevent non-media items from being passed through
  z.looseObject({ type: MediaItemType }),
  z.union([
    z.instanceof(Movie),
    z.instanceof(Show),
    z.instanceof(Season),
    z.instanceof(Episode),
    z.instanceof(RequestedItem),
  ]),
  {
    decode: (data) => {
      switch (data.type) {
        case "movie": {
          return database.movie.create(data, {
            persist: false,
            partial: true,
            managed: true,
          });
        }
        case "show":
          return database.show.create(data, {
            persist: false,
            partial: true,
            managed: true,
          });
        case "season":
          return database.season.create(data, {
            persist: false,
            partial: true,
            managed: true,
          });
        case "episode":
          return database.episode.create(data, {
            persist: false,
            partial: true,
            managed: true,
          });
        case "requested_item":
          return database.requestedItem.create(data, {
            persist: false,
            partial: true,
            managed: true,
          });
      }
    },
    encode: (data) =>
      wrap(data).serialize({
        populate: ["*"],
      }),
  },
);

export type SerialisedMediaItem = z.infer<typeof SerialisedMediaItem>;
