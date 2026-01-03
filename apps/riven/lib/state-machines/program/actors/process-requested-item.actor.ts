import { postgresDataSource } from "@repo/core-util-database/connection";
import { MediaItem } from "@repo/core-util-database/entities/media-items/media-item.entity";
import { RequestedItemEntity } from "@repo/core-util-database/entities/media-items/requested-item.entity";
import { logger } from "@repo/core-util-logger";
import type {
  ProgramToPluginEvent,
  RequestedItem as RequestedItemEventPayload,
} from "@repo/util-plugin-sdk";

import { type ActorRef, type Snapshot, fromPromise } from "xstate";

export interface ProcessRequestedItemInput {
  item: RequestedItemEventPayload;
  // parentRef: ActorRef<Snapshot<unknown>, ProgramToPluginEvent>;
}

export const processRequestedItem = fromPromise<
  undefined,
  ProcessRequestedItemInput
>(async ({ input: { item, parentRef } }) => {
  logger.info("Processing requested item...", item);

  const itemEntity = new RequestedItemEntity();

  if (item.imdbId) {
    itemEntity.imdbId = item.imdbId;
  }

  if (item.tmdbId) {
    itemEntity.tmdbId = item.tmdbId;
  }

  itemEntity.lastState = "Requested";

  try {
    await postgresDataSource.manager.insert(MediaItem, itemEntity);

    parentRef.send({
      type: "riven.media-item.created",
      item: itemEntity,
    });

    logger.info(`Processed requested item: ${JSON.stringify(itemEntity)}`);
  } catch (error) {
    logger.silly(
      `Error inserting requested item: ${JSON.stringify(item)}`,
      error,
    );
  }
});
