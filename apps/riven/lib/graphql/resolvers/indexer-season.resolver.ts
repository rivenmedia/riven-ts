import { Season } from "@repo/util-plugin-sdk/dto/entities";
import { IndexerSeason } from "@repo/util-plugin-sdk/dto/types/indexer-season.type";

import { FieldResolver, Resolver, Root } from "type-graphql";

import { CoreContext } from "#graphql/decorators/core-context.ts";

@Resolver(() => IndexerSeason)
export class IndexerSeasonResolver {
  @FieldResolver(() => Season, { nullable: true })
  public async mediaItem(
    @Root() indexerSeason: IndexerSeason,
    @CoreContext() { services: { mediaItemService } }: CoreContext,
  ) {
    return mediaItemService.getSeasonByShowTvdbId(
      indexerSeason.rootId,
      indexerSeason.number,
    );
  }
}
