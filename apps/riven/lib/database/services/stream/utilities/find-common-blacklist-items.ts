import {
  Episode,
  type MediaEntry,
  MediaItem,
} from "@repo/util-plugin-sdk/dto/entities";

import type { EntityManager, FilterQuery } from "@mikro-orm/core";
import type { UUID } from "node:crypto";

/**
 * Finds all media items that share the provided info-hash/plugin/provider combination.
 *
 * This allows for an easy way to mass-blacklist streams across item hierarchies.
 *
 * @param em The EntityManager to use for database operations
 * @param mediaItemId The ID of the media item to blacklist (this item will be included in the results regardless of its stream info hash, plugin, or provider)
 * @param infoHash The stream info hash to search for
 * @param plugin The plugin to search for
 * @param provider The provider to search for (can be null)
 * @returns An array containing all MediaItems that should be blacklisted
 */
export async function findCommonBlacklistItems(
  em: EntityManager,
  mediaItemId: UUID,
  infoHash: string,
  plugin: string,
  provider: string | null,
) {
  const mediaItemFilter = {
    type: "media",
    provider,
    plugin,
  } as const satisfies FilterQuery<MediaEntry>;

  const [directMatches, episodesWithMatch] = await Promise.all([
    em.find(MediaItem, {
      $or: [
        { id: mediaItemId },
        {
          activeStream: infoHash,
          filesystemEntries: { $some: mediaItemFilter },
        },
      ],
    }),
    em.find(Episode, {
      activeStream: infoHash,
      filesystemEntries: {
        $some: mediaItemFilter,
      },
    }),
  ]);

  const parentItems = await Promise.all(
    episodesWithMatch.flatMap((episode) => [
      episode.getShow(),
      episode.season.loadOrFail(),
    ]),
  );

  const allItems = new Map<UUID, MediaItem>(
    [...directMatches, ...parentItems].map((item) => [item.id, item]),
  );

  return allItems.values().toArray();
}
