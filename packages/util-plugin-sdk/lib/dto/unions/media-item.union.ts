import { createUnionType } from "type-graphql";

import { Episode } from "../entities/media-items/episode.entity.ts";
import { Movie } from "../entities/media-items/movie.entity.ts";
import { Season } from "../entities/media-items/season.entity.ts";
import { Show } from "../entities/media-items/show.entity.ts";

export const MediaItemUnion = createUnionType({
  name: "MediaItemUnion",
  types: () => [Movie, Show, Season, Episode] as const,
  // resolveType: (value) => {
  //   switch (value.type) {
  //     case movie:
  //       return Movie;
  //     case show:
  //       return Show;
  //     case season:
  //       return Season;
  //     case episode:
  //       return Episode;
  //   }
  // },
});
