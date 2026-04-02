import { ItemRequest } from "@repo/util-plugin-sdk/dto/entities";
import { ItemRequestCreateErrorConflict } from "@repo/util-plugin-sdk/schemas/events/item-request.create.error.conflict.event";
import { ItemRequestCreateError } from "@repo/util-plugin-sdk/schemas/events/item-request.create.error.event";

import { ValidationError, validateOrReject } from "class-validator";
import z from "zod";

import { database } from "../../../../database/database.ts";
import { logger } from "../../../../utilities/logger/logger.ts";
import { RequestType } from "../request-content-services.schema.ts";

import type { ContentServiceRequestedResponse } from "@repo/util-plugin-sdk/schemas/events/content-service-requested.event";

export async function persistRequestedShow(
  item: ContentServiceRequestedResponse["shows"][number],
) {
  const externalIds = [
    item.imdbId ? `IMDB: ${item.imdbId}` : null,
    item.tvdbId ? `TVDB: ${item.tvdbId}` : null,
  ].filter(Boolean);

  logger.silly(`Processing requested show: ${externalIds.join(", ")}`);

  return await database.em.fork().transactional(async (transaction) => {
    const existingItem = await transaction.getRepository(ItemRequest).findOne({
      $or: [
        ...(item.imdbId ? [{ imdbId: item.imdbId }] : []),
        ...(item.tvdbId ? [{ tvdbId: item.tvdbId }] : []),
      ],
    });

    if (existingItem?.seasons && item.seasons) {
      const existingItemSeasonsSet = new Set(existingItem.seasons);
      const requestedItemSeasonsSet = new Set(item.seasons);

      if (
        requestedItemSeasonsSet.difference(existingItemSeasonsSet).size === 0
      ) {
        throw new ItemRequestCreateErrorConflict({
          item: existingItem,
        });
      }
    }

    const itemRequest =
      existingItem ??
      transaction.create(ItemRequest, {
        state: "requested",
        requestedBy: item.requestedBy ?? null,
        type: "show",
        imdbId: item.imdbId ?? null,
        tvdbId: item.tvdbId ?? null,
        externalRequestId: item.externalRequestId ?? null,
      });

    itemRequest.seasons = item.seasons ?? null;

    if (existingItem && itemRequest.seasons) {
      const linkedItemsToProcess = await existingItem.seasonItems.matching({
        where: {
          isRequested: false,
          number: {
            $in: itemRequest.seasons,
          },
        },
      });

      for (const linkedItem of linkedItemsToProcess) {
        linkedItem.isRequested = true;

        transaction.persist(linkedItem);
      }
    }

    transaction.persist(itemRequest);

    try {
      await validateOrReject(itemRequest);

      await transaction.flush();

      await transaction.refreshOrFail(itemRequest);

      return {
        requestType: existingItem
          ? RequestType.enum.update
          : RequestType.enum.create,
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
