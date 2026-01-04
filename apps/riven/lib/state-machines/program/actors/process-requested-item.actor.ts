import { database } from "@repo/core-util-database/connection";
import { logger } from "@repo/core-util-logger";
import type {
  ProgramToPluginEvent,
  RequestedItem as RequestedItemEventPayload,
} from "@repo/util-plugin-sdk";
import { RequestedItem } from "@repo/util-plugin-sdk/dto/entities/index";

import { validateOrReject } from "class-validator";
import { type ActorRef, type Snapshot, fromPromise } from "xstate";

export interface ProcessRequestedItemInput {
  item: RequestedItemEventPayload;
  parentRef: ActorRef<Snapshot<unknown>, ProgramToPluginEvent>;
}

export const processRequestedItem = fromPromise<
  undefined,
  ProcessRequestedItemInput
>(async ({ input: { item, parentRef } }) => {
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
    await validateOrReject(itemEntity);

    const result = await database.manager.insert(RequestedItem, itemEntity);
    const item = await database.getRepository(RequestedItem).findOneByOrFail({
      id: result.raw as number,
    });

    parentRef.send({
      type: "riven.media-item.creation.success",
      item,
    });

    logger.info(`Processed requested item: ${JSON.stringify(result)}`);
  } catch (error) {
    console.log(error);
    parentRef.send({
      type: "riven.media-item.creation.error",
      item,
      error,
    });
    logger.silly(
      `Error inserting requested item: ${JSON.stringify(item)}`,
      error,
    );
  }
});
