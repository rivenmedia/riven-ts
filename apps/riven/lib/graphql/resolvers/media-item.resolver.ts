import { Episode, MediaItem, Movie } from "@repo/util-plugin-sdk/dto/entities";
import { MediaItemUnion } from "@repo/util-plugin-sdk/dto/unions/media-item.union";

import { Injectable } from "@nestjs/common";
import chalk from "chalk";
import assert from "node:assert";
import {
  Arg,
  FieldResolver,
  ID,
  Int,
  Mutation,
  Query,
  Resolver,
} from "type-graphql";

import { MediaItemService } from "../../database/services/media-item/media-item.service.ts";
import { StreamService } from "../../database/services/stream/stream.service.ts";
import { InjectLogger } from "../../logging/logging.module.ts";
import { clearDeduplicationJob } from "../../message-queue/utilities/clear-deduplication-job.ts";
import { CoreContext } from "../decorators/core-context.ts";

import type { RivenLogger } from "../../logging/logging.module.ts";
import type { UUID } from "node:crypto";

@Injectable()
@Resolver(() => MediaItem)
export class MediaItemResolver {
  private readonly mediaItemService: MediaItemService;
  private readonly streamService: StreamService;
  private readonly logger: RivenLogger;

  public constructor(
    mediaItemService: MediaItemService,
    streamService: StreamService,
    @InjectLogger() logger: RivenLogger,
  ) {
    this.mediaItemService = mediaItemService;
    this.streamService = streamService;
    this.logger = logger;
  }

  @Query(() => MediaItemUnion, {
    description:
      "Fetches a media item by its ID. The returned type will be one of the specific media item types (e.g., Movie, Episode) based on the underlying data.",
  })
  public async mediaItemById(@Arg("id", () => ID) id: UUID) {
    return this.mediaItemService.getMediaItemById(id);
  }

  @Query(() => [MediaItem])
  public async mediaItems(
    // The entity manager is forked per request, so it stays a context value.
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
  ): Promise<MediaItem[]> {
    const item = await this.mediaItemService.getMediaItemById(id);
    const resetItems = await this.mediaItemService.resetMediaItem(item);

    const { enqueueProcessMediaItem } =
      await import("../../message-queue/flows/process-media-item/enqueue-process-media-item.ts");

    await clearDeduplicationJob(
      "process-media-item",
      `process-${item.type}-${item.id}`,
    );

    await enqueueProcessMediaItem({
      id: item.id,
      isRootItem: this.mediaItemService.rootItemTypes.has(item.type),
      fanOut: false,
    });

    this.logger.info(
      `Reset ${chalk.bold(item.fullTitle)} and enqueued for processing.`,
    );

    return [...resetItems];
  }

  @Mutation(() => Boolean)
  public async blacklistActiveStream(
    @Arg("mediaItemId", () => ID) mediaItemId: UUID,
  ) {
    const mediaItem = await this.mediaItemService.getMediaItemById(mediaItemId);

    assert.ok(
      mediaItem instanceof Movie || mediaItem instanceof Episode,
      "blacklistActiveStream can only be called on Movie or Episode media items",
    );

    const [mediaEntry] = await mediaItem.getMediaEntries();

    assert.ok(mediaEntry, `No media entries found for ${mediaItem.fullTitle}`);

    const { blacklistedItems, infoHash: blacklistedInfoHash } =
      await this.streamService.blacklistActiveStream({
        mediaItem,
        provider: mediaEntry.provider,
        plugin: mediaEntry.plugin,
      });

    this.logger.info(
      `Stream ${blacklistedInfoHash} for ${chalk.bold(mediaEntry.originalFilename)} has been blacklisted`,
    );

    const itemsToReprocess = await this.streamService.calculateItemsToReprocess(
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
