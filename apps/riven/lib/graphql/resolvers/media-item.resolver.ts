import { Episode, MediaItem, Movie } from "@repo/util-plugin-sdk/dto/entities";
import { MediaItemUnion } from "@repo/util-plugin-sdk/dto/unions/media-item.union";

import chalk from "chalk";
import assert from "node:assert";
import {
  Arg,
  Ctx,
  FieldResolver,
  ID,
  Int,
  Mutation,
  Query,
  Resolver,
} from "type-graphql";

import { clearDeduplicationJob } from "../../message-queue/utilities/clear-deduplication-job.ts";
import { CoreContext } from "../decorators/core-context.ts";

import type { ApolloServerContext } from "../context.ts";
import type { UUID } from "node:crypto";

@Resolver(() => MediaItem)
export class MediaItemResolver {
  @Query(() => MediaItemUnion, {
    description:
      "Fetches a media item by its ID. The returned type will be one of the specific media item types (e.g., Movie, Episode) based on the underlying data.",
  })
  public async mediaItemById(
    @CoreContext() { services }: CoreContext,
    @Arg("id", () => ID) id: UUID,
  ) {
    return services.mediaItemService.getMediaItemById(id);
  }

  @Query(() => [MediaItem])
  public async mediaItems(
    @CoreContext() { em }: CoreContext,
  ): Promise<MediaItem[]> {
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
  public async resetMediaItem(
    @Arg("id", () => ID) id: UUID,
    @CoreContext() { services: { mediaItemService } }: CoreContext,
    @Ctx() { logger }: ApolloServerContext,
  ): Promise<MediaItem[]> {
    const item = await mediaItemService.getMediaItemById(id);
    const resetItems = await mediaItemService.resetMediaItem(item);

    const { enqueueProcessMediaItem } =
      await import("../../message-queue/flows/process-media-item/enqueue-process-media-item.ts");

    await clearDeduplicationJob(
      "process-media-item",
      `process-${item.type}-${item.id}`,
    );

    await enqueueProcessMediaItem({
      id: item.id,
      isRootItem: mediaItemService.rootItemTypes.has(item.type),
      fanOut: false,
    });

    logger.info(
      `Reset ${chalk.bold(item.fullTitle)} and enqueued for processing.`,
    );

    return [...resetItems];
  }

  @Mutation(() => Boolean)
  public async blacklistActiveStream(
    @Arg("mediaItemId", () => ID) mediaItemId: UUID,
    @CoreContext() {
      services: { mediaItemService, streamService },
    }: CoreContext,
    @Ctx() { logger }: ApolloServerContext,
  ) {
    const mediaItem = await mediaItemService.getMediaItemById(mediaItemId);

    assert.ok(
      mediaItem instanceof Movie || mediaItem instanceof Episode,
      "blacklistActiveStream can only be called on Movie or Episode media items",
    );

    const [mediaEntry] = await mediaItem.getMediaEntries();

    assert.ok(mediaEntry, `No media entries found for ${mediaItem.fullTitle}`);

    const { blacklistedItems, infoHash: blacklistedInfoHash } =
      await streamService.blacklistActiveStream({
        mediaItem,
        provider: mediaEntry.provider,
        plugin: mediaEntry.plugin,
      });

    logger.info(
      `Stream ${blacklistedInfoHash} for ${chalk.bold(mediaEntry.originalFilename)} has been blacklisted`,
    );

    const itemsToReprocess = await streamService.calculateItemsToReprocess(
      new Set(blacklistedItems),
    );

    const { enqueueProcessMediaItem } =
      await import("../../message-queue/flows/process-media-item/enqueue-process-media-item.ts");

    for (const { id, type } of itemsToReprocess) {
      await clearDeduplicationJob(
        "process-media-item",
        `process-${type}-${id}`,
      );

      await enqueueProcessMediaItem({ id });
    }

    return true;
  }

  @FieldResolver(() => Int)
  public expectedFileCount() {
    throw new Error(
      "expectedFileCount field resolver must be implemented in child resolvers",
    );
  }
}
