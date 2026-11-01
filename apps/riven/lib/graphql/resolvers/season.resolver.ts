import { Episode, Season, Show } from "@repo/util-plugin-sdk/dto/entities";

import {
  Arg,
  FieldResolver,
  ID,
  Int,
  Resolver,
  Root,
  Subscription,
} from "type-graphql";

import { CoreContext } from "#graphql/decorators/core-context.ts";

import type { UUID } from "node:crypto";
import type { SubscribeResolverData } from "type-graphql";

@Resolver(() => Season)
export class SeasonResolver {
  @Subscription(() => Season, {
    description:
      "Emits the season for the given ID whenever its state, or the state of any of its episodes, changes.",
    topics: "SEASON_UPDATED",
    topicId: ({ args }: SubscribeResolverData<unknown, { id: UUID }>) =>
      args.id,
  })
  public async seasonUpdated(
    @Arg("id", () => ID) _id: UUID,
    @Root() seasonId: UUID,
    @CoreContext() { em }: CoreContext,
  ) {
    // A subscription's context lives as long as the subscription,
    // (e.g. the entire duration a user is on a page), so a fresh fork
    // is used for each event to avoid resolving stale data from its identity map.
    return em.fork().findOneOrFail(Season, seasonId);
  }

  @FieldResolver(() => Show)
  public async show(@Root() season: Season) {
    return season.show.loadOrFail();
  }

  @FieldResolver(() => [Episode])
  public async episodes(@Root() season: Season) {
    return season.episodes.loadItems({
      orderBy: { number: "asc" },
    });
  }

  @FieldResolver(() => Int)
  public async totalEpisodes(@Root() season: Season) {
    return season.episodes.loadCount();
  }

  @FieldResolver(() => Int)
  public async expectedFileCount(@Root() season: Season) {
    return season.episodes.loadCount();
  }

  @FieldResolver(() => Int)
  public async completedEpisodeCount(@Root() season: Season) {
    return season.episodes.loadCount({
      where: { state: "completed" },
    });
  }
}
