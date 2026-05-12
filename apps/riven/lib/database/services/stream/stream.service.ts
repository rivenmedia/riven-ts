import { MediaEntry, type MediaItem } from "@repo/util-plugin-sdk/dto/entities";

import { CreateRequestContext } from "@mikro-orm/decorators/legacy";
import assert from "node:assert";

import { BaseService } from "../core/base-service.ts";
import { blacklistStream } from "./utilities/blacklist-stream.ts";
import { isFatalStatusCode } from "./utilities/is-fatal-status-code.ts";

import type { UUID } from "node:crypto";

export class StreamService extends BaseService {
  isFatalStatusCode(statusCode: number) {
    return isFatalStatusCode(statusCode);
  }

  @CreateRequestContext()
  async saveStreamUrl(entryId: UUID, streamUrl: string) {
    return this.em.getRepository(MediaEntry).saveStreamUrl(entryId, streamUrl);
  }

  @CreateRequestContext()
  async blacklistActiveStream({
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

    return blacklistStream(
      this.em,
      mediaItem,
      activeStream.infoHash,
      plugin,
      provider,
    );
  }
}
