import { ItemRequest } from "@repo/util-plugin-sdk/dto/entities";
import { ItemRequestCreateErrorConflict } from "@repo/util-plugin-sdk/schemas/events/item-request.create.error.conflict.event";
import { ItemRequestCreateError } from "@repo/util-plugin-sdk/schemas/events/item-request.create.error.event";

import { ValidationError, validateOrReject } from "class-validator";
import { Field, InputType, Int, ObjectType } from "type-graphql";
import z from "zod";

import { RequestType } from "../../../message-queue/flows/request-content-services/request-content-services.schema.ts";
import { logger } from "../../../utilities/logger/logger.ts";

import type { EntityManager } from "@mikro-orm/core";
import type { ContentServiceRequestedResponse } from "@repo/util-plugin-sdk/schemas/events/content-service-requested.event";

type ShowData = ContentServiceRequestedResponse["shows"][number];

@InputType()
export class PersistShowItemRequestInput implements ShowData {
  @Field(() => String, { nullable: true })
  externalRequestId?: string;

  @Field(() => String, { nullable: true })
  imdbId?: string;

  @Field(() => String, { nullable: true })
  tvdbId?: string;

  @Field(() => [Int], { nullable: true })
  seasons?: number[];

  @Field(() => String, { nullable: true })
  requestedBy?: string;
}

@ObjectType()
export class PersistShowItemRequestOutput {
  @Field(() => RequestType.enum)
  requestType!: RequestType;

  @Field(() => ItemRequest)
  item!: ItemRequest;
}

export async function persistShowItemRequest(
  item: PersistShowItemRequestInput,
  em: EntityManager,
) {
  const externalIds = [
    item.imdbId ? `IMDB: ${item.imdbId}` : null,
    item.tvdbId ? `TVDB: ${item.tvdbId}` : null,
  ].filter(Boolean);

  logger.silly(`Processing requested show: ${externalIds.join(", ")}`);

  return await em.transactional(async (transaction) => {
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
