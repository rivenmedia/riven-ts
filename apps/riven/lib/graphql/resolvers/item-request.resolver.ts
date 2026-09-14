import { ItemRequestedEvent } from "@repo/util-plugin-sdk/schemas/events/item-requested.event";

import { Arg, Ctx, ID, Mutation, Resolver } from "type-graphql";

import { clearDeduplicationJob } from "../../message-queue/utilities/clear-deduplication-job.ts";
import { CoreContext } from "../decorators/core-context.ts";
import { RequestItemInput } from "../inputs/request-item.input.ts";

import type { ApolloServerContext } from "../context.ts";
import type { UUID } from "node:crypto";

@Resolver()
export class ItemRequestResolver {
  @Mutation(() => Boolean)
  public requestItem(
    @Arg("input", () => RequestItemInput) input: RequestItemInput,
    @Ctx() { logger }: ApolloServerContext,
    @CoreContext() { sendEvent }: CoreContext,
  ): boolean {
    const event = ItemRequestedEvent.parse({
      type: "riven-external.item-requested",
      item: {
        type: input.type,
        ...(input.imdbId != null && { imdbId: input.imdbId }),
        ...(input.tmdbId != null && { tmdbId: input.tmdbId }),
        ...(input.tvdbId != null && { tvdbId: input.tvdbId }),
        ...(input.seasons?.length ? { seasons: input.seasons } : {}),
        ...(input.preferences ? { preferences: input.preferences } : {}),
        requestedBy: null,
      },
    });

    logger.info(
      `Manual item request received for ${input.type} (imdbId: ${input.imdbId ?? "n/a"}, tmdbId: ${input.tmdbId ?? "n/a"}, tvdbId: ${input.tvdbId ?? "n/a"})`,
    );

    sendEvent(event);

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
