import { MediaItem } from "@repo/util-plugin-sdk/dto/entities";
import { MediaItemState } from "@repo/util-plugin-sdk/dto/enums/media-item-state.enum";
import { MediaItemType } from "@repo/util-plugin-sdk/dto/enums/media-item-type.enum";
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
import { createCursorType } from "../types/create-cursor-type.ts";

import type { UUID } from "node:crypto";

const MediaItemCursor = createCursorType<MediaItem>(
  "MediaItem",
  MediaItemUnion,
);

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

  @Query(() => MediaItemCursor)
  async mediaItems(
    @CoreContext() { em }: CoreContext,
    @Arg("first", () => Int, { nullable: true, defaultValue: 25 })
    first: number,
    @Arg("after", () => String, { nullable: true }) after?: string,
    @Arg("types", () => [MediaItemType.enum], {
      nullable: true,
      defaultValue: [MediaItemType.enum.movie, MediaItemType.enum.show],
    })
    types?: MediaItemType[],
    @Arg("sort", () => String, { nullable: true, defaultValue: "  " })
    sort?: string,
    @Arg("search", () => String, { nullable: true }) search?: string,
    @Arg("states", () => [MediaItemState.enum], { nullable: true })
    states?: MediaItemState[],
  ): Promise<InstanceType<typeof MediaItemCursor>> {
    return em.findByCursor(MediaItem, {
      first,
      orderBy: sort ? { createdAt: sort } : { createdAt: "desc" },
      ...(after && { after }),
      where: {
        ...(search && { title: { $ilike: `%${search}%` } }),
        ...(types && { type: { $in: types } }),
        ...(states && { state: { $in: states } }),
      },
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

  @FieldResolver(() => Int)
  expectedFileCount() {
    throw new Error(
      "expectedFileCount field resolver must be implemented in child resolvers",
    );
  }
}
