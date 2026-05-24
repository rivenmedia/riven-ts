import {
  BlacklistedStream,
  MediaItem,
} from "@repo/util-plugin-sdk/dto/entities";

import { findCommonBlacklistItems } from "./find-common-blacklist-items.ts";

import type { EntityManager } from "@mikro-orm/core";

export async function blacklistStream(
  em: EntityManager,
  mediaItem: MediaItem,
  infoHash: string,
  plugin: string,
  provider: string | null,
) {
  const itemsToBlacklist = await findCommonBlacklistItems(em, mediaItem);

  for (const item of itemsToBlacklist) {
    item.reset();
  }

  for (const item of itemsToBlacklist) {
    em.create(BlacklistedStream, {
      mediaItem: item,
      stream: infoHash,
      plugin,
      provider,
    });

    await em.flush();
  }

  return {
    blacklistedItems: itemsToBlacklist,
    infoHash,
  };
}
