import { MediaItem, Stream } from "@repo/util-plugin-sdk/dto/entities";
import { MediaItemUnion } from "@repo/util-plugin-sdk/dto/unions/media-item.union";

import {
  Arg,
  FieldResolver,
  ID,
  Int,
  Mutation,
  Query,
  Resolver,
  Root,
} from "type-graphql";

import { CoreContext } from "../decorators/core-context.ts";
import { createPaginationResultType } from "../types/pagination-result.type.ts";

import type { UUID } from "node:crypto";

const MediaItemPaginationResult = createPaginationResultType(MediaItemUnion);

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

  @Query(() => MediaItemPaginationResult)
  async mediaItems(
    @CoreContext() { em }: CoreContext,
    @Arg("after", () => String, { nullable: true }) after: string | null,
    @Arg("first", () => Int, { nullable: true, defaultValue: 25 })
    first: number,
  ): Promise<InstanceType<typeof MediaItemPaginationResult>> {
    return em.findByCursor(MediaItem, {
      first,
      orderBy: { createdAt: "ASC" },
      ...(after ? { after } : {}),
    });
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

  @FieldResolver(() => [Stream])
  streams(@Root() mediaItem: MediaItem) {
    return mediaItem.streams.loadItems();
  }

  @FieldResolver(() => Int)
  expectedFileCount() {
    throw new Error(
      "expectedFileCount field resolver must be implemented in child resolvers",
    );
  }
}
