import {
  Episode,
  Movie,
  Season,
  ShowLikeMediaItem,
} from "@repo/util-plugin-sdk/dto/entities";

import type { MediaItem } from "@repo/util-plugin-sdk/dto/entities";

async function getItemToReprocess(
  item: MediaItem,
  mediaItems: Set<MediaItem>,
): Promise<MediaItem | undefined> {
  if (item instanceof Movie) {
    return item;
  }

  if (item instanceof ShowLikeMediaItem) {
    const show = await item.getShow();

    if (mediaItems.has(show)) {
      return show;
    }
  }

  if (item instanceof Season) {
    const episodes = await item.episodes.loadItems();

    if (episodes.every((episode) => mediaItems.has(episode))) {
      return item;
    }
  }

  if (item instanceof Episode) {
    const season = await item.season.loadOrFail();

    return mediaItems.has(season) ? season : item;
  }

  return undefined;
}

export async function calculateItemsToReprocess(mediaItems: Set<MediaItem>) {
  if (mediaItems.size === 0) {
    throw new Error(
      "Cannot determine items to reprocess: no media items provided",
    );
  }

  const itemsToReprocess = new Set<MediaItem>();

  for (const item of mediaItems) {
    const itemToReprocess = await getItemToReprocess(item, mediaItems);

    if (itemToReprocess) {
      itemsToReprocess.add(itemToReprocess);
    }
  }

  return itemsToReprocess;
}
