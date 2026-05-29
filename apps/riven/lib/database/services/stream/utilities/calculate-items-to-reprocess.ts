import {
  Episode,
  type MediaItem,
  Movie,
  Season,
  ShowLikeMediaItem,
} from "@repo/util-plugin-sdk/dto/entities";

export async function calculateItemsToReprocess(mediaItems: Set<MediaItem>) {
  if (mediaItems.size === 0) {
    throw new Error(
      "Cannot determine items to reprocess: no media items provided",
    );
  }

  const itemsToReprocess = new Set<MediaItem>();

  for (const item of mediaItems) {
    if (item instanceof Movie) {
      itemsToReprocess.add(item);
    }

    if (item instanceof ShowLikeMediaItem) {
      const show = await item.getShow();

      if (mediaItems.has(show)) {
        itemsToReprocess.add(show);

        continue;
      }
    }

    if (item instanceof Season) {
      const episodes = await item.episodes.loadItems();

      if (episodes.every((episode) => mediaItems.has(episode))) {
        itemsToReprocess.add(item);

        continue;
      }
    }

    if (item instanceof Episode) {
      const season = await item.season.loadOrFail();
      const itemToAdd = mediaItems.has(season) ? season : item;

      itemsToReprocess.add(itemToAdd);
    }
  }

  return itemsToReprocess;
}
