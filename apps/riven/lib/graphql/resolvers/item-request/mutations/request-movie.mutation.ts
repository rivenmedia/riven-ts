import { ItemRequest } from "@repo/util-plugin-sdk/dto/entities";
import { ItemRequestCreateErrorConflict } from "@repo/util-plugin-sdk/schemas/events/item-request.create.error.conflict.event";
import { ItemRequestCreateError } from "@repo/util-plugin-sdk/schemas/events/item-request.create.error.event";

import { ValidationError, validateOrReject } from "class-validator";
import z from "zod";

import { RequestType } from "../../../../message-queue/flows/request-content-services/request-content-services.schema.ts";

import type { EntityManager } from "@mikro-orm/core";
import type { ContentServiceRequestedResponse } from "@repo/util-plugin-sdk/schemas/events/content-service-requested.event";

export async function requestMovieMutation(
  em: EntityManager,
  item: ContentServiceRequestedResponse["movies"][number],
) {
  const { logger } = await import("../../../../utilities/logger/logger.ts");

  const externalIds = [
    item.imdbId ? `IMDB: ${item.imdbId}` : null,
    item.tmdbId ? `TMDB: ${item.tmdbId}` : null,
  ].filter(Boolean);

  logger.silly(`Processing requested movie: ${externalIds.join(", ")}`);

  return em.transactional(async (transaction) => {
    const existingItem = await transaction.findOne(ItemRequest, {
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

    const itemRequest = transaction.create(ItemRequest, {
      state: "requested",
      requestedBy: item.requestedBy ?? null,
      type: "movie",
      imdbId: item.imdbId ?? null,
      tmdbId: item.tmdbId ?? null,
      externalRequestId: item.externalRequestId ?? null,
    });

    try {
      await validateOrReject(itemRequest);

      await transaction.flush();

      await transaction.refreshOrFail(itemRequest);

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
                err.constraints
                  ? Object.values(err.constraints).join("; ")
                  : "",
              )
              .join("; ");
          }

          return error.message;
        })
        .parse(error);

      throw new ItemRequestCreateError({
        item: itemRequest,
        error: errorMessage,
      });
    }
  });
}
