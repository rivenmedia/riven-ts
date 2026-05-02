import { ItemRequest } from "@rivenmedia/plugin-sdk/dto/entities";
import { ItemRequestCreateErrorConflict } from "@rivenmedia/plugin-sdk/schemas/events/item-request.create.error.conflict.event";
import { ItemRequestCreateError } from "@rivenmedia/plugin-sdk/schemas/events/item-request.create.error.event";

import { ValidationError, validateOrReject } from "class-validator";
import z from "zod";

import { RequestType } from "../../../../message-queue/flows/request-content-services/request-content-services.schema.ts";

import type { EntityManager } from "@mikro-orm/core";
import type { ContentServiceRequestedResponse } from "@rivenmedia/plugin-sdk/schemas/events/content-service-requested.event";

export async function persistRequestedShow(
  em: EntityManager,
  item: ContentServiceRequestedResponse["shows"][number],
) {
  const existingItem = await em.findOne(ItemRequest, {
    $or: [
      ...(item.imdbId ? [{ imdbId: item.imdbId }] : []),
      ...(item.tvdbId ? [{ tvdbId: item.tvdbId }] : []),
    ],
  });

  if (existingItem?.seasons && item.seasons) {
    const existingItemSeasonsSet = new Set(existingItem.seasons);
    const requestedItemSeasonsSet = new Set(item.seasons);

    if (requestedItemSeasonsSet.difference(existingItemSeasonsSet).size === 0) {
      throw new ItemRequestCreateErrorConflict({
        item: existingItem,
      });
    }
  }

  const itemRequest =
    existingItem ??
    em.create(ItemRequest, {
      state: "requested",
      requestedBy: item.requestedBy ?? null,
      type: "show",
      imdbId: item.imdbId ?? null,
      tvdbId: item.tvdbId ?? null,
      externalRequestId: item.externalRequestId ?? null,
    });

  itemRequest.seasons =
    existingItem?.seasons?.length && item.seasons
      ? new Set([...existingItem.seasons, ...item.seasons])
          .values()
          .toArray()
          .sort()
      : (item.seasons ?? existingItem?.seasons ?? null);

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

      em.persist(linkedItem);
    }
  }

  em.persist(itemRequest);

  try {
    await validateOrReject(itemRequest);

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
              err.constraints ? Object.values(err.constraints).join("; ") : "",
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
}
