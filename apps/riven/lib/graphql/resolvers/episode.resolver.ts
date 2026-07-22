import { Episode, Season } from "@repo/util-plugin-sdk/dto/entities";

import { Arg, FieldResolver, Int, Query, Resolver, Root } from "type-graphql";

import { CoreContext } from "../decorators/core-context.ts";

@Resolver(() => Episode)
export class EpisodeResolver {
  @Query(() => Episode, {
    description:
      "Fetches an episode by its TVDB ID, season number, and episode number. If season number is not provided, it will lookup using absolute episode numbering.",
    nullable: true,
  })
  public async episode(
    @CoreContext() { em }: CoreContext,
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
  public async season(@Root() episode: Episode) {
    return episode.season.loadOrFail();
  }

  @FieldResolver(() => [String])
  public async lookupKeys(@Root() episode: Episode) {
    const seasonNumber = await episode.season.loadProperty("number");

    return [
      `abs:${episode.absoluteNumber.toString()}`,
      `${seasonNumber.toString()}:${episode.number.toString()}`,
    ];
  }

  @FieldResolver(() => Int)
  public expectedFileCount(@Root() episode: Episode) {
    return episode.getExpectedFileCount();
  }
}
