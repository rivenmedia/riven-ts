import { MediaItem } from "@repo/util-plugin-sdk/dto/entities";
import { MediaItemUnion } from "@repo/util-plugin-sdk/dto/unions/media-item.union";

import {
  Arg,
  FieldResolver,
  ID,
  Int,
  Mutation,
  Query,
  Resolver,
} from "type-graphql";

import { CoreContext } from "../decorators/core-context.ts";

import type { UUID } from "node:crypto";

@Resolver(() => MediaItem)
export class MediaItemResolver {
  @Query(() => MediaItemUnion, {
    description:
      "Fetches a media item by its ID. The returned type will be one of the specific media item types (e.g., Movie, Episode) based on the underlying data.",
  })
  mediaItemById(
    @CoreContext() { services }: CoreContext,
    @Arg("id", () => ID) id: UUID,
  ) {
    return services.mediaItemService.getMediaItemById(id);
  }

  @Query(() => [MediaItem])
  mediaItems(@CoreContext() { em }: CoreContext): Promise<MediaItem[]> {
    return em.find(
      MediaItem,
      {},
      {
        limit: 25,
        overfetch: true,
      },
    );
  }

  @Mutation(() => [MediaItemUnion])
  async resetMediaItem(
    @Arg("id", () => ID) id: UUID,
    @CoreContext() { services: { mediaItemService } }: CoreContext,
  ): Promise<MediaItem[]> {
    const item = await mediaItemService.getMediaItemById(id);
    const resetItems = await mediaItemService.resetMediaItem(item);

    return Array.from(resetItems);
  }

  @FieldResolver(() => Int)
  expectedFileCount() {
    throw new Error(
      "expectedFileCount field resolver must be implemented in child resolvers",
    );
  }
}
