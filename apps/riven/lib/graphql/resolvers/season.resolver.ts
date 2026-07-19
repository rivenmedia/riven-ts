import { Episode, Season, Show } from "@repo/util-plugin-sdk/dto/entities";

import { FieldResolver, Int, Resolver, Root } from "type-graphql";

@Resolver(() => Season)
export class SeasonResolver {
  @FieldResolver(() => Show)
  async show(@Root() season: Season) {
    return season.show.loadOrFail();
  }

  @FieldResolver(() => [Episode])
  async episodes(@Root() season: Season) {
    return season.episodes.loadItems();
  }

  @FieldResolver(() => Int)
  async totalEpisodes(@Root() season: Season) {
    return season.episodes.loadCount();
  }

  @FieldResolver(() => Int)
  async expectedFileCount(@Root() season: Season) {
    return season.episodes.loadCount();
  }
}
