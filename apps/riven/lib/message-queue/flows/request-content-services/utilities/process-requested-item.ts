import { ItemRequest } from "@repo/util-plugin-sdk/dto/entities";

import { ValidationError, validateOrReject } from "class-validator";
import z from "zod";

import { database } from "../../../../database/database.ts";
import { logger } from "../../../../utilities/logger/logger.ts";

import type { MainRunnerMachineIntake } from "../../../../state-machines/main-runner/index.ts";
import type { ContentServiceRequestedResponse } from "@repo/util-plugin-sdk/schemas/events/content-service-requested.event";

export type ProcessRequestedItemInput = {
  sendEvent: MainRunnerMachineIntake;
} & (
  | {
      type: "show";
      item: ContentServiceRequestedResponse["shows"][number];
    }
  | {
      type: "movie";
      item: ContentServiceRequestedResponse["movies"][number];
    }
);

export interface ProcessRequestedItemOutput {
  isNewItem: boolean;
}

export async function processRequestedItem({
  item,
  type,
  sendEvent,
}: ProcessRequestedItemInput): Promise<ProcessRequestedItemOutput> {
  const externalIds = [
    item.imdbId ? `IMDB: ${item.imdbId}` : null,
    type === "movie" && item.tmdbId ? `TMDB: ${item.tmdbId}` : null,
    type === "show" && item.tvdbId ? `TVDB: ${item.tvdbId}` : null,
  ].filter(Boolean);

  logger.silly(`Processing requested item: ${externalIds.join(", ")}`);

  const existingItem = await database.itemRequest.findOne({
    $or: [
      ...(item.imdbId ? [{ imdbId: item.imdbId }] : []),
      ...(type === "movie" && item.tmdbId ? [{ tmdbId: item.tmdbId }] : []),
      ...(type === "show" && item.tvdbId ? [{ tvdbId: item.tvdbId }] : []),
    ],
  });

  if (existingItem) {
    sendEvent({
      type: "riven.media-item.creation.error.conflict",
      item: existingItem,
    });

    return {
      isNewItem: false,
    };
  }

  const em = database.em.fork();

  const itemRequest = em.create(ItemRequest, {
    requestedBy: "unknown",
    state: "requested",
    type,
    imdbId: item.imdbId ?? null,
    tmdbId: (type === "movie" ? item.tmdbId : null) ?? null,
    tvdbId: (type === "show" ? item.tvdbId : null) ?? null,
  });

  try {
    await validateOrReject(itemRequest);

    await em.flush();

    await em.refreshOrFail(itemRequest);

    sendEvent({
      type: "riven.item-request.creation.success",
      item: itemRequest,
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
      item: itemRequest,
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
