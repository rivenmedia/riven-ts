import { fromPromise } from "xstate";

import { services } from "../../../database/database.ts";
import { enqueueProcessMediaItem } from "../../../message-queue/flows/process-media-item/enqueue-process-media-item.ts";

import type { UUID } from "node:crypto";

export interface FanOutDownloadByIdInput {
  itemId: UUID;
}

/**
 * Fan-out variant keyed on item id rather than the entity.
 *
 * The NZB lifecycle events (`nzb-scrape.error`, etc.) carry only `itemId` — not
 * the hydrated MediaItem the torrent-side `fanOutDownload` receives — so this
 * loads the item's incomplete children via `getFanOutDownloadItems`
 * (Show→seasons, Season→episodes; Movie/Episode→`[]`, a safe no-op for leaves)
 * and enqueues each ahead of the parent (lifo) just like the torrent path.
 */
export const fanOutDownloadById = fromPromise<
  undefined,
  FanOutDownloadByIdInput
>(async ({ input: { itemId } }) => {
  const itemsToProcess =
    await services.downloaderService.getFanOutDownloadItems(itemId);

  for (const item of itemsToProcess) {
    await enqueueProcessMediaItem(
      {
        id: item.id,
        isRootItem: false,
      },
      {
        // Insert at the front of the queue to process the fanned-out items
        // after the parent item.
        lifo: true,
      },
    );
  }
});
