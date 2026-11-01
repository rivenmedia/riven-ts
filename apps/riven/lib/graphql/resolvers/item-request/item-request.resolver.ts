import { ItemRequest } from "@repo/util-plugin-sdk/dto/entities";

import {
  Arg,
  Args,
  Ctx,
  ID,
  Mutation,
  Query,
  Resolver,
  Root,
  Subscription,
} from "type-graphql";

import { ExternalIdsArgs } from "#graphql/args/external-ids.args.ts";
import { CoreContext } from "#graphql/decorators/core-context.ts";
import { getExternalIdTopics } from "#graphql/pubsub.ts";
import { clearDeduplicationJob } from "#message-queue/utilities/clear-deduplication-job.ts";

import { RequestItemInput } from "./inputs/request-item.input.ts";

import type { ApolloServerContext } from "#graphql/context.ts";
import type { GraphQLContext } from "@repo/util-plugin-sdk/types/graphql-context";
import type { UUID } from "node:crypto";
import type { SubscribeResolverData } from "type-graphql";

@Resolver(() => ItemRequest)
export class ItemRequestResolver {
  @Subscription(() => ID, {
    description:
      "Emits the ID of the item request with the given external ID whenever it is created, updated, indexed or removed. Only the first provided external ID is used, in the order TMDB, TVDB, IMDB.",
    topics: "ITEM_REQUEST_CHANGED",
    topicId: ({ args }: SubscribeResolverData<unknown, ExternalIdsArgs>) => {
      const [topic] = getExternalIdTopics(args);

      if (!topic) {
        throw new Error("At least one external ID must be provided");
      }

      return topic;
    },
  })
  public itemRequestChanged(
    @Args(() => ExternalIdsArgs) _externalIds: ExternalIdsArgs,
    @Root() itemRequestId: UUID,
  ) {
    return itemRequestId;
  }

  @Query(() => ItemRequest, { nullable: true })
  public async itemRequestByExternalIds(
    @CoreContext() { services: { itemRequestService } }: CoreContext,
    @Args(() => ExternalIdsArgs) externalIds: ExternalIdsArgs,
  ) {
    return itemRequestService.getItemRequestByExternalIds(externalIds);
  }

  @Mutation(() => Boolean)
  public requestItem(
    @Arg("input", () => RequestItemInput)
    input: RequestItemInput,
    @Ctx() { sendEvent }: GraphQLContext,
  ) {
    sendEvent({
      item: {
        requestedBy: input.requestedBy,
        tmdbId: input.tmdbId,
        imdbId: input.imdbId,
        tvdbId: input.tvdbId,
        ...(input.type === "show"
          ? { type: "show", seasons: input.requestedSeasons }
          : { type: "movie" }),
      },
      type: "riven-external.item-requested",
    });

    return true;
  }

  @Mutation(() => Boolean)
  public async removeItemRequest(
    @Arg("itemRequestId", () => ID) itemRequestId: UUID,
    @Ctx() { logger }: ApolloServerContext,
    @CoreContext() { sendEvent, services: { itemRequestService } }: CoreContext,
  ): Promise<boolean> {
    try {
      const itemRequest =
        await itemRequestService.getItemRequestById(itemRequestId);

      const title = await itemRequest.getMediaItemTitle();

      if (
        await clearDeduplicationJob(
          "process-item-request",
          `reindex-item-${itemRequest.id}`,
        )
      ) {
        logger.silly(
          `Removed jobs for item request ${itemRequest.id} from the process-item-request queue`,
        );
      }

      for (const item of await itemRequest.mediaItems.loadItems()) {
        if (
          await clearDeduplicationJob(
            "process-media-item",
            `process-${item.type}-${item.id}`,
          )
        ) {
          logger.silly(
            `Removed jobs for ${item.fullTitle} from the process-media-item queue`,
          );
        }
      }

      await itemRequestService.removeItemRequest(itemRequest);

      sendEvent({
        type: "riven.item-request.removed",
        item: itemRequest,
        title,
      });

      return true;
    } catch (error) {
      logger.error(`Failed to remove item request with ID ${itemRequestId}`, {
        err: error,
      });

      throw error;
    }
  }
}
