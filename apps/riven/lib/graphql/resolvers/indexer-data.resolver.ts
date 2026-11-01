import { IndexerData } from "@repo/util-plugin-sdk/dto/types/indexer-data.type";
import { Ratings } from "@repo/util-plugin-sdk/dto/types/ratings.type";
import { MediaItemUnion } from "@repo/util-plugin-sdk/dto/unions/media-item.union";

import { FieldResolver, Resolver, Root } from "type-graphql";

import { CoreContext } from "#graphql/decorators/core-context.ts";

@Resolver(() => IndexerData)
export class IndexerDataResolver {
  @FieldResolver(() => Ratings)
  public ratings() {
    return {};
  }

  @FieldResolver(() => MediaItemUnion, { nullable: true })
  public async mediaItem(
    @Root() indexerData: IndexerData,
    @CoreContext() { services: { mediaItemService } }: CoreContext,
  ) {
    return mediaItemService.getMediaItemByExternalId(
      indexerData.id,
      indexerData.type,
    );
  }
}
