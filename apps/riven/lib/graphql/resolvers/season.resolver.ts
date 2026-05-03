import { Episode, Season, Show } from "@repo/util-plugin-sdk/dto/entities";

import { FieldResolver, Int, Resolver, Root } from "type-graphql";

@Resolver(() => Season)
export class SeasonResolver {
  @FieldResolver(() => Show)
  show(@Root() season: Season) {
    return season.show.loadOrFail();
  }

  @FieldResolver(() => [Episode])
  episodes(@Root() season: Season) {
    return season.episodes.loadItems();
  }

  @FieldResolver(() => Int)
  totalEpisodes(@Root() season: Season) {
    return season.episodes.loadCount();
  }

  @FieldResolver(() => Int)
  expectedFileCount(@Root() season: Season) {
    return season.episodes.loadCount();
  }
}
