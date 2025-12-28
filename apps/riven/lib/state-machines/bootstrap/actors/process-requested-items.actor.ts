import { postgresDataSource } from "@repo/core-util-database/connection";
import { MediaItem } from "@repo/core-util-database/entities/media-items/media-item.entity";
import { RequestedItem } from "@repo/core-util-database/entities/media-items/requested-item.entity";
import { fromPromise } from "xstate";
import type { RequestedItem as RequestedItemEventPayload } from "@repo/util-plugin-sdk";
import { logger } from "@repo/core-util-logger";

export interface ProcessRequestedItemsInput {
  items: RequestedItemEventPayload[];
}

export const processRequestedItems = fromPromise<
  undefined,
  ProcessRequestedItemsInput
>(async ({ input: { items } }) => {
  logger.info("Processing requested items...", items);

  for (const item of items) {
    const itemEntity = new RequestedItem();

    if (item.imdbId) {
      itemEntity.imdbId = item.imdbId;
    }

    if (item.tmdbId) {
      itemEntity.tmdbId = item.tmdbId;
    }

    itemEntity.lastState = "Requested";

    try {
      await postgresDataSource.manager.insert(MediaItem, itemEntity);
    } catch (error) {
      logger.silly(
        `Error inserting requested item: ${JSON.stringify(item)}`,
        error,
      );
    }
  }

  logger.info(`Processed ${items.length.toString()} requested items.`);
});
