import { createUnionType } from "type-graphql";

import { Episode } from "../entities/media-items/episode.entity.ts";
import { Movie } from "../entities/media-items/movie.entity.ts";
import { Season } from "../entities/media-items/season.entity.ts";
import { RequestedItem } from "../entities/requests/item-request.entity.ts";

export const MediaItemUnion = createUnionType({
  name: "MediaItemUnion",
  types: () => [Movie, Season, Episode, RequestedItem] as const,
});
