import { Season, Show } from "@repo/util-plugin-sdk/dto/entities";

import { FieldResolver, Resolver, Root } from "type-graphql";

@Resolver((_of) => Season)
export class SeasonResolver {
  @FieldResolver(() => Show)
  show(@Root() season: Season) {
    return season.show.loadOrFail();
  }

  @FieldResolver(() => [Season])
  episodes(@Root() season: Season) {
    return season.episodes.loadItems();
  }
}
