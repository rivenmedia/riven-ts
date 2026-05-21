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
    case "indexed":
      return "scrape";
    case "scraped":
      return "download";
    default:
      throw new Error(`Unexpected media item state: ${item.state}`);
  }
}

export const retryLibrary = fromPromise(async () => {
  try {
    logger.verbose("Retrying library items");

    const pendingItems =
      await services.retryLibraryService.getMediaItemsToRetry();

    const pendingRequests =
      await services.retryLibraryService.getItemRequestsToRetry();

    if (pendingItems.length === 0 && pendingRequests.length === 0) {
      logger.verbose("No pending library items to retry");

      return;
    }

    if (pendingItems.length > 0) {
      logger.verbose(
        `Found ${pendingItems.length.toString()} pending library items to retry`,
      );
    }

    if (pendingRequests.length > 0) {
      logger.verbose(
        `Found ${pendingRequests.length.toString()} pending item requests to retry`,
      );
    }

    for (const request of pendingRequests) {
      await enqueueProcessItemRequest({ item: request });
    }

    for (const item of pendingItems) {
      const step = getMediaItemStep(item);

      await enqueueProcessMediaItem({
        id: item.id,
        step,
      });
    }
  } catch (error) {
    logger.error("Error retrying library", { err: error });
  }
});
