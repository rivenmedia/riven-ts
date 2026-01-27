import { wrap } from "@mikro-orm/core";
import z from "zod";

import {
  Episode,
  MediaItemType,
  Movie,
  RequestedItem,
  Season,
  Show,
} from "../../dto/entities/index.ts";

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
        case "movie":
          return Movie.create(data);
        case "show":
          return Show.create(data);
        case "season":
          return Season.create(data);
        case "episode":
          return Episode.create(data);
        case "requested_item":
          return RequestedItem.create(data);
        default:
          throw new Error(`Unknown media item type: ${data.type as string}`);
      }
    },
    encode: (data) => wrap(data).toJSON(),
  },
);

export type SerialisedMediaItem = z.infer<typeof SerialisedMediaItem>;
