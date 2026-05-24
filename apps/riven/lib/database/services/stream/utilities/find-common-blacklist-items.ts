import { MediaItem } from "@repo/util-plugin-sdk/dto/entities";

import assert from "node:assert";

import type { EntityManager } from "@mikro-orm/core";

/**
 * Finds all media items that share the original item's active stream.
 *
 * This allows for an easy way to mass-blacklist streams across item hierarchies.
 *
 * @param item The original blacklist target
 * @returns An array containing all MediaItems that should be blacklisted
 */
export async function findCommonBlacklistItems(
  em: EntityManager,
  item: MediaItem,
) {
  assert(item.activeStream);

  return em.getRepository(MediaItem).find({
    activeStream: item.activeStream,
  });
}
