import { database } from "@repo/core-util-database/connection";
import { logger } from "@repo/core-util-logger";
import {
  MediaItem,
  RequestedItem,
} from "@repo/util-plugin-sdk/dto/entities/index";

import { ValidationError, validateOrReject } from "class-validator";
import { type ActorRef, type Snapshot, fromPromise } from "xstate";
import z from "zod";

import type { ParamsFor } from "@repo/util-plugin-sdk";
import type { MediaItemRequestedEvent } from "@repo/util-plugin-sdk/plugin-to-program-events/media-item/requested";
import type { ProgramToPluginEvent } from "@repo/util-plugin-sdk/program-to-plugin-events";

export interface ProcessRequestedItemInput {
  item: ParamsFor<MediaItemRequestedEvent>["item"];
  parentRef: ActorRef<Snapshot<unknown>, ProgramToPluginEvent>;
}

export const processRequestedItem = fromPromise<
  undefined,
  ProcessRequestedItemInput
>(async ({ input: { item, parentRef } }) => {
  logger.info("Processing requested item...", item);

  const existingItem = await database.manager.findOne(MediaItem, {
    where: [
      ...(item.imdbId ? [{ imdbId: item.imdbId }] : []),
      ...(item.tmdbId ? [{ tmdbId: item.tmdbId }] : []),
      ...(item.tvdbId ? [{ tvdbId: item.tvdbId }] : []),
    ],
  });

  if (existingItem) {
    parentRef.send({
      type: "riven.media-item.creation.already-exists",
      item: {
        ...item,
        id: existingItem.id,
        ...(existingItem.title ? { title: existingItem.title } : {}),
      },
    });

    return undefined;
  }

  const itemEntity = new RequestedItem();

  if (item.imdbId) {
    itemEntity.imdbId = item.imdbId;
  }

  if (item.tmdbId) {
    itemEntity.tmdbId = item.tmdbId;
  }

  itemEntity.state = "Requested";

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
  } catch (error) {
    const parsedError = z
      .union([z.instanceof(Error), z.array(z.instanceof(ValidationError))])
      .parse(error);

    parentRef.send({
      type: "riven.media-item.creation.error",
      item,
      error: Array.isArray(parsedError)
        ? parsedError
            .map((err) =>
              err.constraints ? Object.values(err.constraints).join("; ") : "",
            )
            .join("; ")
        : parsedError.message,
    });
  }
});
