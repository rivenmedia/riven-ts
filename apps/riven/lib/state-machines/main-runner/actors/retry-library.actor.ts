import { Episode, Movie } from "@repo/util-plugin-sdk/dto/entities";

import { fromPromise } from "xstate";

import { services } from "../../../database/database.ts";
import { enqueueProcessItemRequest } from "../../../message-queue/flows/process-item-request/enqueue-process-item-request.ts";
import { enqueueProcessMediaItem } from "../../../message-queue/flows/process-media-item/enqueue-process-media-item.ts";
import { logger } from "../../../utilities/logger/logger.ts";

import type { ProcessMediaItemFlow } from "../../../message-queue/flows/process-media-item/process-media-item.schema.ts";
import type { MediaItem } from "@repo/util-plugin-sdk/dto/entities";

function getMediaItemStep(
  item: MediaItem,
): ProcessMediaItemFlow["input"]["step"] {
  switch (item.state) {
    case "partially_completed":
    case "indexed": {
      return "scrape";
    }
    case "scraped": {
      return "download";
    }
    case "downloaded":
    case "failed":
    case "completed":
    case "paused":
    case "unreleased": {
      throw new Error(`Unexpected media item state: ${item.state}`);
    }
  }
}

export const retryLibrary = fromPromise(async () => {
  try {
    logger.verbose("Retrying library items");

    const pendingRequests =
      await services.retryLibraryService.getItemRequestsToRetry();

    const pendingItems =
      await services.retryLibraryService.getMediaItemsToRetry();

    if (pendingItems.length === 0 && pendingRequests.length === 0) {
      logger.verbose("No pending library items to retry");

      return;
    }

    if (pendingRequests.length > 0) {
      logger.verbose(
        `Found ${pendingRequests.length.toString()} pending item request(s) to retry`,
      );
    }

    if (pendingItems.length > 0) {
      logger.verbose(
        `Found ${pendingItems.length.toString()} pending library item(s) to retry`,
      );
    }

    for (const request of pendingRequests) {
      await enqueueProcessItemRequest({ item: request });
    }

    for (const item of pendingItems) {
      const itemsToProcess =
        item instanceof Movie || item instanceof Episode
          ? [item]
          : await item.getIncompleteItems();

      for (const itemToProcess of itemsToProcess) {
        await enqueueProcessMediaItem({
          id: itemToProcess.id,
          step: getMediaItemStep(itemToProcess),
          fanOut: false,
        });
      }
    }
  } catch (error) {
    logger.error("Error retrying library", { err: error });
  }
});
