import { ItemRequest } from "@repo/util-plugin-sdk/dto/entities";
import { ItemRequestAction } from "@repo/util-plugin-sdk/dto/enums/item-request-action.enum";
import { ItemRequestState } from "@repo/util-plugin-sdk/dto/enums/item-request-state.enum";

import {
  Arg,
  Args,
  Ctx,
  FieldResolver,
  ID,
  Mutation,
  Query,
  Resolver,
  Root,
} from "type-graphql";

import { ExternalIdsArgs } from "#graphql/args/external-ids.args.ts";
import { CoreContext } from "#graphql/decorators/core-context.ts";
import { clearDeduplicationJob } from "#message-queue/utilities/clear-deduplication-job.ts";

import { RequestItemInput } from "./inputs/request-item.input.ts";

import type { ApolloServerContext } from "#graphql/context.ts";
import type { GraphQLContext } from "@repo/util-plugin-sdk/types/graphql-context";
import type { UUID } from "node:crypto";

@Resolver(() => ItemRequest)
export class ItemRequestResolver {
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

  @FieldResolver(() => [ItemRequestAction.enum])
  public async availableActions(
    @Root() itemRequest: ItemRequest,
  ): Promise<ItemRequestAction[]> {
    const actions = new Set<ItemRequestAction>(["reset"]);
    const primaryMediaItem = await itemRequest.primaryMediaItem();

    if (primaryMediaItem?.state === "failed") {
      actions.add("retry");
    }

    const pausableStates = ItemRequestState.exclude([
      "failed",
      "completed",
      "paused",
      "unreleased",
    ]);

    if (pausableStates.safeParse(itemRequest.state).success) {
      actions.add("pause");
    }

    if (itemRequest.state === "paused") {
      actions.add("resume");
    }

    if (itemRequest.type === "show" && itemRequest.isPartialRequest) {
      actions.add("request_more");
    }

    actions.add("delete");

    return [...actions];
  }
}
