import { IndexerBaseItem } from "@repo/util-plugin-sdk/dto/types/indexer-base-item.type";
import { MediaItemUnion } from "@repo/util-plugin-sdk/dto/unions/media-item.union";

import { FieldResolver, Resolver, Root } from "type-graphql";

import { CoreContext } from "#graphql/decorators/core-context.ts";

@Resolver(() => IndexerBaseItem)
export class IndexerBaseItemResolver {
  @FieldResolver(() => MediaItemUnion, { nullable: true })
  public async mediaItem(
    @Root() indexerBaseItem: IndexerBaseItem,
    @CoreContext() { services: { mediaItemService } }: CoreContext,
  ) {
    return mediaItemService.getMediaItemByExternalId(
      indexerBaseItem.id,
      indexerBaseItem.type,
    );
  }
}
