import { createUnionType } from "type-graphql";

import { Episode } from "#dto/entities/media-items/episode.entity.ts";
import { Movie } from "#dto/entities/media-items/movie.entity.ts";
import { Season } from "#dto/entities/media-items/season.entity.ts";
import { Show } from "#dto/entities/media-items/show.entity.ts";

export const MediaItemUnion = createUnionType({
  name: "MediaItemUnion",
  types: () => [Movie, Show, Season, Episode] as const,
});
