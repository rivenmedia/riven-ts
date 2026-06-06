import { BlacklistedStream } from "@repo/util-plugin-sdk/dto/entities";

import { findCommonBlacklistItems } from "./find-common-blacklist-items.ts";

import type { EntityManager } from "@mikro-orm/core";
import type { UUID } from "node:crypto";

export async function blacklistStream(
  em: EntityManager,
  mediaItemId: UUID,
  infoHash: string,
  plugin: string,
  provider: string | null,
) {
  const itemsToBlacklist = await findCommonBlacklistItems(
    em,
    mediaItemId,
    infoHash,
    plugin,
    provider,
  );

  for (const item of itemsToBlacklist) {
    em.create(BlacklistedStream, {
      mediaItem: item,
      stream: infoHash,
      plugin,
      provider,
    });
  }

  return {
    blacklistedItems: itemsToBlacklist,
    infoHash,
  };
}
