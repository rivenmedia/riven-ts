import { Season, Show } from "@repo/util-plugin-sdk/dto/entities";

import type { EntityManager } from "@mikro-orm/core";
import type { MediaItem } from "@repo/util-plugin-sdk/dto/entities";

async function getChildren(item: MediaItem) {
  if (item instanceof Show) {
    return item.seasons.loadItems();
  }

  if (item instanceof Season) {
    return item.episodes.loadItems();
  }

  return null;
}

export async function resetMediaItem(
  em: EntityManager,
  target: MediaItem,
  resetItems = new Set<MediaItem>(),
) {
  const children = await getChildren(target);

  if (children) {
    await Promise.all(
      children.map(async (child) => resetMediaItem(em, child, resetItems)),
    );
  }

  target.reset();

  resetItems.add(target);

  em.persist(target);

  return resetItems;
}
