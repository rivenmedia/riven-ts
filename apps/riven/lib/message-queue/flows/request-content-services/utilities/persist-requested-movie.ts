import { ItemRequest } from "@repo/util-plugin-sdk/dto/entities";
import { ItemRequestCreationErrorConflict } from "@repo/util-plugin-sdk/schemas/events/item-request.creation.error.conflict.event";
import { ItemRequestCreationError } from "@repo/util-plugin-sdk/schemas/events/item-request.creation.error.event";

import { ValidationError, validateOrReject } from "class-validator";
import z from "zod";

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
    throw new ItemRequestCreationErrorConflict({
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
    await validateOrReject(itemRequest);

    await em.flush();

    await em.refreshOrFail(itemRequest);

    return {
      requestType: RequestType.enum.create,
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
