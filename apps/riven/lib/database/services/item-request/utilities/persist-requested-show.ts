import { ItemRequest } from "@repo/util-plugin-sdk/dto/entities";
import { ItemRequestCreateErrorConflict } from "@repo/util-plugin-sdk/schemas/events/item-request.create.error.conflict.event";
import { ItemRequestCreateError } from "@repo/util-plugin-sdk/schemas/events/item-request.create.error.event";

import { validateOrReject } from "class-validator";

import { getValidationErrorMessage } from "#database/services/core/utilities/get-validation-error-message.ts";
import { RequestType } from "#message-queue/flows/request-content-service/request-content-service.schema.ts";

import type { EntityManager } from "@mikro-orm/core";
import type { ContentServiceRequestedResponse } from "@repo/util-plugin-sdk/schemas/events/content-service-requested.event";

function mergeRequestedSeasons(
  existingSeasons: number[] | null | undefined,
  requestedSeasons: number[] | null | undefined,
) {
  if (existingSeasons?.length && requestedSeasons) {
    return new Set([...existingSeasons, ...requestedSeasons])
      .values()
      .toArray()
      .toSorted((a, b) => a - b);
  }

  return requestedSeasons ?? existingSeasons ?? null;
}

async function markSeasonsAsRequested(
  em: EntityManager,
  itemRequest: ItemRequest,
  seasonNumbers: number[],
) {
  const linkedItemsToProcess = await itemRequest.seasonItems.matching({
    where: {
      isRequested: false,
      number: {
        $in: seasonNumbers,
      },
    },
  });

  for (const linkedItem of linkedItemsToProcess) {
    em.assign(linkedItem, { isRequested: true });

    const episodes = await linkedItem.episodes.loadItems();

    for (const episode of episodes) {
      em.assign(episode, { isRequested: true });
    }
  }
}

export async function persistRequestedShow(
  em: EntityManager,
  item: ContentServiceRequestedResponse["shows"][number],
) {
  const existingItem = await em.findOne(ItemRequest, {
    $or: [
      ...(item.imdbId ? [{ imdbId: item.imdbId }] : []),
      ...(item.tvdbId ? [{ tvdbId: item.tvdbId }] : []),
      ...(item.tmdbId ? [{ tmdbId: item.tmdbId }] : []),
    ],
  });

  const existingItemSeasonsSet = new Set(existingItem?.seasons);
  const requestedItemSeasonsSet = new Set(item.seasons);
  const requestedSeasonsDifference = requestedItemSeasonsSet.difference(
    existingItemSeasonsSet,
  );

  const isIdenticalPartialRequest = Boolean(
    existingItem?.seasons &&
    item.seasons &&
    requestedSeasonsDifference.size === 0,
  );

  const isIdenticalCompleteRequest = Boolean(
    existingItem && !existingItem.seasons && !item.seasons,
  );

  if (
    existingItem &&
    (isIdenticalPartialRequest || isIdenticalCompleteRequest)
  ) {
    throw new ItemRequestCreateErrorConflict({
      item: existingItem,
    });
  }

  const itemRequest =
    existingItem ??
    em.create(ItemRequest, {
      state: "requested",
      requestedBy: item.requestedBy ?? null,
      type: "show",
      imdbId: item.imdbId ?? null,
      tvdbId: item.tvdbId ?? null,
      tmdbId: item.tmdbId ?? null,
      externalRequestId: item.externalRequestId ?? null,
    });

  itemRequest.seasons = mergeRequestedSeasons(
    existingItem?.seasons,
    item.seasons,
  );

  if (
    existingItem &&
    itemRequest.seasons &&
    requestedSeasonsDifference.size > 0
  ) {
    await markSeasonsAsRequested(em, existingItem, itemRequest.seasons);
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
    throw new ItemRequestCreateError({
      item: itemRequest,
      error: getValidationErrorMessage(error),
    });
  }
}
