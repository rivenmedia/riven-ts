import { Episode, Season } from "@repo/util-plugin-sdk/dto/entities";

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

@Resolver((_of) => Episode)
export class EpisodeResolver {
  @Query(() => Episode, {
    description:
      "Fetches an episode by its TVDB ID, season number, and episode number.",
  })
  episode(
    @Ctx() { em }: ApolloServerContext,
    @Arg("tvdbId", () => String) tvdbId: string,
    @Arg("season", () => Int) season: number,
    @Arg("episode", () => Int) episode: number,
  ) {
    return em.findOneOrFail(Episode, {
      tvdbId,
      number: episode,
      season: {
        number: season,
      },
    });
  }

  @Query(() => Episode, { nullable: true })
  absoluteEpisode(
    @Ctx() { em }: ApolloServerContext,
    @Arg("tvdbId", () => String) tvdbId: string,
    @Arg("episodeNumber", () => Int) episodeNumber: number,
    @Arg("seasonNumber", () => Int, { nullable: true })
    seasonNumber: number | null,
  ) {
    return em
      .getRepository(Episode)
      .findAbsoluteEpisode(tvdbId, episodeNumber, seasonNumber);
  }

  @FieldResolver(() => Season)
  season(@Root() episode: Episode) {
    return episode.season.loadOrFail();
  }

  @FieldResolver(() => [String])
  async lookupKeys(@Root() episode: Episode) {
    const seasonNumber = await episode.season.loadProperty("number");

    return [
      `abs:${episode.absoluteNumber.toString()}`,
      `${seasonNumber.toString()}:${episode.number.toString()}`,
    ];
  }

  @FieldResolver(() => Int)
  expectedFileCount() {
    return 1;
  }
}
