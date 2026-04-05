import { ItemRequest } from "@repo/util-plugin-sdk/dto/entities";
import { ItemRequestCreateErrorConflict } from "@repo/util-plugin-sdk/schemas/events/item-request.create.error.conflict.event";
import { ItemRequestCreateError } from "@repo/util-plugin-sdk/schemas/events/item-request.create.error.event";

import { ValidationError, validateOrReject } from "class-validator";
import { Field, InputType, ObjectType } from "type-graphql";
import z from "zod";

import { RequestType } from "../../../message-queue/flows/request-content-services/request-content-services.schema.ts";
import { logger } from "../../../utilities/logger/logger.ts";

import type { EntityManager } from "@mikro-orm/core";
import type { ContentServiceRequestedResponse } from "@repo/util-plugin-sdk/schemas/events/content-service-requested.event";

type MovieItemRequest = ContentServiceRequestedResponse["movies"][number];

@InputType()
export class PersistMovieItemRequestInput implements MovieItemRequest {
  @Field(() => String, { nullable: true })
  externalRequestId?: string;

  @Field(() => String, { nullable: true })
  imdbId?: string;

  @Field(() => String, { nullable: true })
  tmdbId?: string;

  @Field(() => String, { nullable: true })
  requestedBy?: string;
}

@ObjectType()
export class PersistMovieItemRequestOutput {
  @Field(() => RequestType.enum)
  requestType!: RequestType;

  @Field(() => ItemRequest)
  item!: ItemRequest;
}

export async function persistMovieItemRequest(
  item: PersistMovieItemRequestInput,
  em: EntityManager,
) {
  const externalIds = [
    item.imdbId ? `IMDB: ${item.imdbId}` : null,
    item.tmdbId ? `TMDB: ${item.tmdbId}` : null,
  ].filter(Boolean);

  logger.silly(`Processing requested movie: ${externalIds.join(", ")}`);

  const existingItem = await em.findOne(ItemRequest, {
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

    throw new ItemRequestCreateError({
      item: itemRequest,
      error: errorMessage,
    });
  }
}
