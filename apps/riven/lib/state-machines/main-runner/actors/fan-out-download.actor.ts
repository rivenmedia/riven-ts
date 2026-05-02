import {
  Episode,
  type MediaItem,
  Movie,
} from "@rivenmedia/plugin-sdk/dto/entities";

import { fromPromise } from "xstate";

import { services } from "../../../database/database.ts";
import { enqueueProcessMediaItem } from "../../../message-queue/flows/process-media-item/enqueue-process-media-item.ts";

export interface FanOutDownloadInput {
  item: MediaItem;
}

export const fanOutDownload = fromPromise<undefined, FanOutDownloadInput>(
  async ({ input: { item } }) => {
    if (item instanceof Movie || item instanceof Episode) {
      // No fan-out necessary for movies or individual episodes,
      // as they are the leaf nodes in the media item hierarchy
      return;
    }

    const itemsToProcess =
      await services.downloaderService.getFanOutDownloadItems(item.id);

    for (const item of itemsToProcess) {
      await enqueueProcessMediaItem(
        { id: item.id },
        {
          // Insert at the front of the queue to process
          // the fanned-out items after the parent item
          lifo: true,
        },
      );
    }
  },
);
