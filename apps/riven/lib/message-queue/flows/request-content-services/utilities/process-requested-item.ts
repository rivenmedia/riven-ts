import { ItemRequest } from "@repo/util-plugin-sdk/dto/entities";
import { ItemRequestCreationErrorConflict } from "@repo/util-plugin-sdk/schemas/events/item-request.creation.error.conflict.event";
import { ItemRequestCreationError } from "@repo/util-plugin-sdk/schemas/events/item-request.creation.error.event";

import { ValidationError, validateOrReject } from "class-validator";
import z from "zod";

import { database } from "../../../../database/database.ts";
import { logger } from "../../../../utilities/logger/logger.ts";

import type { ContentServiceRequestedResponse } from "@repo/util-plugin-sdk/schemas/events/content-service-requested.event";

export type ProcessRequestedItemInput =
  | {
      type: "show";
      item: ContentServiceRequestedResponse["shows"][number];
    }
  | {
      type: "movie";
      item: ContentServiceRequestedResponse["movies"][number];
    };

export interface ProcessRequestedItemOutput {
  isNewItem: boolean;
  item: ItemRequest;
}

export async function processRequestedItem({
  item,
  type,
}: ProcessRequestedItemInput): Promise<ProcessRequestedItemOutput> {
  const externalIds = [
    item.imdbId ? `IMDB: ${item.imdbId}` : null,
    type === "movie" && item.tmdbId ? `TMDB: ${item.tmdbId}` : null,
    type === "show" && item.tvdbId ? `TVDB: ${item.tvdbId}` : null,
  ].filter(Boolean);

  logger.silly(`Processing requested ${type}: ${externalIds.join(", ")}`);

  const existingItem = await database.itemRequest.findOne({
    $or: [
      ...(item.imdbId ? [{ imdbId: item.imdbId }] : []),
      ...(type === "movie" && item.tmdbId ? [{ tmdbId: item.tmdbId }] : []),
      ...(type === "show" && item.tvdbId ? [{ tvdbId: item.tvdbId }] : []),
    ],
  });

  if (existingItem) {
    throw new ItemRequestCreationErrorConflict({
      item: existingItem,
    });
  }

  const em = database.em.fork();

  const itemRequest = em.create(ItemRequest, {
    requestedBy: "unknown",
    state: "requested",
    type,
    imdbId: item.imdbId ?? null,
    tmdbId: (type === "movie" ? item.tmdbId : null) ?? null,
    tvdbId: (type === "show" ? item.tvdbId : null) ?? null,
    externalRequestId: item.externalRequestId ?? null,
  });

  try {
    await validateOrReject(itemRequest);

    await em.flush();

    await em.refreshOrFail(itemRequest);

    return {
      isNewItem: true,
      item: itemRequest,
    };
  } catch (error) {
    const errorMessage = z
      .union([z.instanceof(Error), z.array(z.instanceof(ValidationError))])
      .transform((error) => {
        if (Array.isArray(error)) {
          return error
            .map((err) =>
              err.constraints ? Object.values(err.constraints).join("; ") : "",
            )
            .join("; ");
        }

        return error.message;
      })
      .parse(error);

    throw new ItemRequestCreationError({
      item: itemRequest,
      error: errorMessage,
    });
  }
}
