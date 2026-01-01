import { postgresDataSource } from "@repo/core-util-database/connection";
import { MediaItem } from "@repo/core-util-database/entities/media-items/media-item.entity";
import { RequestedItem } from "@repo/core-util-database/entities/media-items/requested-item.entity";
import { logger } from "@repo/core-util-logger";
import type { RequestedItem as RequestedItemEventPayload } from "@repo/util-plugin-sdk";

import { fromPromise } from "xstate";

export interface ProcessRequestedItemInput {
  item: RequestedItemEventPayload;
}

export const processRequestedItem = fromPromise<
  undefined,
  ProcessRequestedItemInput
>(async ({ input: { item } }) => {
  logger.info("Processing requested item...", item);

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

  logger.info(`Processed requested item: ${JSON.stringify(itemEntity)}`);
});
