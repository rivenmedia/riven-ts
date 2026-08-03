import { Arg, Ctx, ID, Mutation, Resolver } from "type-graphql";

import { clearDeduplicationJob } from "../../message-queue/utilities/clear-deduplication-job.ts";
import { CoreContext } from "../decorators/core-context.ts";

import type { ApolloServerContext } from "../context.ts";
import type { UUID } from "node:crypto";

@Resolver()
export class ItemRequestResolver {
  @Mutation(() => Boolean)
  public async removeItemRequest(
    @Arg("id", () => ID) id: UUID,
    @Ctx() { logger }: ApolloServerContext,
    @CoreContext() { sendEvent, services: { itemRequestService } }: CoreContext,
  ): Promise<boolean> {
    const itemRequest = await itemRequestService.getItemRequestById(id);

    try {
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
      });

      return true;
    } catch (error) {
      logger.error(`Failed to remove item request with ID ${id}`, {
        err: error,
      });

      return false;
    }
  }
}
