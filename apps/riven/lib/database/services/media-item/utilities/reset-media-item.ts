import {
  type MediaItem,
  Season,
  Show,
} from "@repo/util-plugin-sdk/dto/entities";

import type { EntityManager } from "@mikro-orm/core";

function getChildren(item: MediaItem) {
  if (item instanceof Show) {
    return item.seasons.loadItems({ ref: true });
  }

  if (item instanceof Season) {
    return item.episodes.loadItems({ ref: true });
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
      children.map((child) => resetMediaItem(em, child, resetItems)),
    );
  }

  target.reset();
  resetItems.add(target);

  return resetItems;
}
