import { Episode } from "@repo/util-plugin-sdk/dto/entities";
import { IndexerEpisode } from "@repo/util-plugin-sdk/dto/types/indexer-episode.type";

import { FieldResolver, Resolver, Root } from "type-graphql";

import { CoreContext } from "#graphql/decorators/core-context.ts";

@Resolver(() => IndexerEpisode)
export class IndexerEpisodeResolver {
  @FieldResolver(() => Episode, { nullable: true })
  public async mediaItem(
    @Root() indexerEpisode: IndexerEpisode,
    @CoreContext() { services: { mediaItemService } }: CoreContext,
  ) {
    return mediaItemService.getEpisodeByShowTvdbId(indexerEpisode.rootId, {
      seasonNumber: indexerEpisode.seasonNumber,
      episodeNumber: indexerEpisode.number,
    });
  }
}
