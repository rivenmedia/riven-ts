import {
  BlacklistedStream,
  MediaEntry,
} from "@repo/util-plugin-sdk/dto/entities";

import {
  CreateRequestContext,
  EnsureRequestContext,
  Transactional,
} from "@mikro-orm/decorators/legacy";
import assert from "node:assert";

import { redisCache } from "../../../utilities/redis-cache.ts";
import { BaseService } from "../core/base-service.ts";
import { blacklistStream } from "./utilities/blacklist-stream.ts";
import { calculateItemsToReprocess } from "./utilities/calculate-items-to-reprocess.ts";
import { isFatalStatusCode } from "./utilities/is-fatal-status-code.ts";

import type { FilterObject } from "@mikro-orm/core";
import type { MediaItem } from "@repo/util-plugin-sdk/dto/entities";
import type { UUID } from "node:crypto";

export class StreamService extends BaseService {
  public isFatalStatusCode(statusCode: number) {
    return isFatalStatusCode(statusCode);
  }

  public async saveStreamLink(entryId: UUID, streamUrl: string, ttl: number) {
    await redisCache.set(`stream-link:${entryId}`, streamUrl, { ttl });
  }

  public async getStreamLink(entryId: UUID) {
    return redisCache.get(`stream-link:${entryId}`);
  }

  public async clearStreamLink(entryId: UUID) {
    await redisCache.delete(`stream-link:${entryId}`);
  }

  @CreateRequestContext()
  public async saveStreamPermalink(entryId: UUID, streamUrl: string) {
    return this.em
      .getRepository(MediaEntry)
      .saveStreamPermalink(entryId, streamUrl);
  }

  @CreateRequestContext()
  public async clearStreamPermalink(entryId: UUID) {
    return this.em.getRepository(MediaEntry).clearStreamPermalink(entryId);
  }

  @EnsureRequestContext()
  @Transactional()
  public async blacklistStreamByInfoHash(
    mediaItemId: UUID,
    infoHash: string,
    plugin: string,
    provider: string | null,
  ) {
    return blacklistStream(this.em, mediaItemId, infoHash, plugin, provider);
  }

  @CreateRequestContext()
  @Transactional()
  public async blacklistActiveStream({
    mediaItem,
    provider,
    plugin,
  }: {
    mediaItem: MediaItem;
    provider: string | null;
    plugin: string;
  }) {
    const activeStream = await mediaItem.activeStream?.loadOrFail();

    assert(
      activeStream,
      `${mediaItem.fullTitle} does not have an active stream to blacklist`,
    );

    const result = await this.blacklistStreamByInfoHash(
      mediaItem.id,
      activeStream.infoHash,
      plugin,
      provider,
    );

    for (const item of result.blacklistedItems) {
      item.reset();
    }

    return result;
  }

  public async calculateItemsToReprocess(mediaItems: Set<MediaItem>) {
    return calculateItemsToReprocess(mediaItems);
  }

  @CreateRequestContext()
  public async isStreamBlacklisted(query: FilterObject<BlacklistedStream>) {
    const count = await this.em.count(BlacklistedStream, query);

    return count > 0;
  }
}
