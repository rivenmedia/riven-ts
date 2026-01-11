import { database } from "@repo/core-util-database/connection";
import { logger } from "@repo/core-util-logger";
import {
  MediaItem,
  RequestedItem,
} from "@repo/util-plugin-sdk/dto/entities/index";

import { ValidationError, validateOrReject } from "class-validator";
import z from "zod";

import type { MainRunnerMachineIntake } from "../index.ts";
import type { ContentServiceRequestedResponse } from "@repo/util-plugin-sdk/schemas/events/media-item/content-service-requested";

export interface ProcessRequestedItemInput {
  sendEvent: MainRunnerMachineIntake;
  item: ContentServiceRequestedResponse[number];
}

export interface ProcessRequestedItemOutput {
  isNewItem: boolean;
}

export async function processRequestedItem({
  item,
  sendEvent,
}: ProcessRequestedItemInput): Promise<ProcessRequestedItemOutput> {
  const externalIds = [
    item.imdbId ? `IMDB: ${item.imdbId}` : null,
    item.tmdbId ? `TMDB: ${item.tmdbId}` : null,
    item.tvdbId ? `TVDB: ${item.tvdbId}` : null,
  ];

  logger.silly(
    `Processing requested item: ${externalIds.filter(Boolean).join(", ")}`,
  );

  const existingItem = await database.manager.findOne(MediaItem, {
    where: [
      ...(item.imdbId ? [{ imdbId: item.imdbId }] : []),
      ...(item.tmdbId ? [{ tmdbId: item.tmdbId }] : []),
      ...(item.tvdbId ? [{ tvdbId: item.tvdbId }] : []),
    ],
  });

  if (existingItem) {
    sendEvent({
      type: "riven.media-item.creation.already-exists",
      item: existingItem,
    });

    return {
      isNewItem: false,
    };
  }

  const itemEntity = new RequestedItem();

  if (item.imdbId) {
    itemEntity.imdbId = item.imdbId;
  }

  if (item.tmdbId) {
    itemEntity.tmdbId = item.tmdbId;
  }

  if (item.tvdbId) {
    itemEntity.tvdbId = item.tvdbId;
  }

  itemEntity.state = "Requested";

  try {
    await validateOrReject(itemEntity);

    const result = await database.manager.insert(RequestedItem, itemEntity);
    const item = await database.manager.findOneByOrFail(RequestedItem, {
      id: result.identifiers[0]?.["id"] as number,
    });

    sendEvent({
      type: "riven.media-item.creation.success",
      item,
    });

    return {
      isNewItem: true,
    };
  } catch (error) {
    const parsedError = z
      .union([z.instanceof(Error), z.array(z.instanceof(ValidationError))])
      .parse(error);

    sendEvent({
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

    return {
      isNewItem: false,
    };
  }
}
