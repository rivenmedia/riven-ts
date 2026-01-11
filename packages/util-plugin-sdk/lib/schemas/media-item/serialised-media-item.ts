import { instanceToPlain, plainToInstance } from "class-transformer";
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
        case "Movie":
          return plainToInstance(Movie, data);
        case "Show":
          return plainToInstance(Show, data);
        case "Season":
          return plainToInstance(Season, data);
        case "Episode":
          return plainToInstance(Episode, data);
        case "RequestedItem":
          return plainToInstance(RequestedItem, data);
        default:
          throw new Error(`Unknown media item type: ${data.type as string}`);
      }
    },
    encode: (data) =>
      instanceToPlain(data, {
        excludeExtraneousValues: true,
      }) as { type: MediaItemType },
  },
);
