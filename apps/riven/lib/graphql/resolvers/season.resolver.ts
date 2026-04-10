import { Episode, Season, Show } from "@repo/util-plugin-sdk/dto/entities";

import {
  Arg,
  Ctx,
  FieldResolver,
  Int,
  Query,
  Resolver,
  Root,
} from "type-graphql";

import type { ApolloServerContext } from "@repo/core-util-graphql-schema";

@Resolver((_of) => Season)
export class SeasonResolver {
  @Query(() => Season, {
    description: "Fetches a season by its TVDB ID and season number.",
  })
  season(
    @Ctx() { em }: ApolloServerContext,
    @Arg("tvdbId", () => String) tvdbId: string,
    @Arg("season", () => Int) season: number,
  ) {
    return em.findOneOrFail(Season, {
      tvdbId,
      number: season,
    });
  }

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
