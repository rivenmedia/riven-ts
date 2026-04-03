import { ItemRequest } from "@repo/util-plugin-sdk/dto/entities";
import { ItemRequestCreateErrorConflict } from "@repo/util-plugin-sdk/schemas/events/item-request.create.error.conflict.event";
import { ItemRequestCreateError } from "@repo/util-plugin-sdk/schemas/events/item-request.create.error.event";

import { database } from "../../../../database/database.ts";
import { logger } from "../../../../utilities/logger/logger.ts";
import { RequestType } from "../request-content-services.schema.ts";

import type { ContentServiceRequestedResponse } from "@repo/util-plugin-sdk/schemas/events/content-service-requested.event";

export async function persistRequestedMovie(
  item: ContentServiceRequestedResponse["movies"][number],
) {
  const externalIds = [
    item.imdbId ? `IMDB: ${item.imdbId}` : null,
    item.tmdbId ? `TMDB: ${item.tmdbId}` : null,
  ].filter(Boolean);

  logger.silly(`Processing requested movie: ${externalIds.join(", ")}`);

  const existingItem = await database.itemRequest.findOne({
    $or: [
      ...(item.imdbId ? [{ imdbId: item.imdbId }] : []),
      ...(item.tmdbId ? [{ tmdbId: item.tmdbId }] : []),
    ],
  });

  if (existingItem) {
    // Movies will only ever have one request per item.
    // Re-requesting the same item is a no-op.
    throw new ItemRequestCreateErrorConflict({
      item: existingItem,
    });
  }

  const em = database.em.fork();

  const itemRequest = em.create(ItemRequest, {
    state: "requested",
    requestedBy: item.requestedBy ?? null,
    type: "movie",
    imdbId: item.imdbId ?? null,
    tmdbId: item.tmdbId ?? null,
    externalRequestId: item.externalRequestId ?? null,
  });

  try {
    await em.flush();

    await em.refreshOrFail(itemRequest);

    return {
      requestType: RequestType.enum.create,
      item: itemRequest,
    };
  } catch (error) {
    throw new ItemRequestCreateError({
      item: itemRequest,
      error: String(error),
    });
  }
}
