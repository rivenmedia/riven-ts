import { Injectable } from "@nestjs/common";
import { Arg, ID, Mutation, Resolver } from "type-graphql";

import { ItemRequestService } from "../../database/services/item-request/item-request.service.ts";
import { InjectLogger } from "../../logging/logging.module.ts";
import { clearDeduplicationJob } from "../../message-queue/utilities/clear-deduplication-job.ts";
import { CoreContext } from "../decorators/core-context.ts";

import type { RivenLogger } from "../../logging/logging.module.ts";
import type { UUID } from "node:crypto";

@Injectable()
@Resolver()
export class ItemRequestResolver {
  private readonly itemRequestService: ItemRequestService;
  private readonly logger: RivenLogger;

  public constructor(
    itemRequestService: ItemRequestService,
    @InjectLogger() logger: RivenLogger,
  ) {
    this.itemRequestService = itemRequestService;
    this.logger = logger;
  }

  @Mutation(() => Boolean)
  public async removeItemRequest(
    @Arg("id", () => ID) id: UUID,
    // `sendEvent` is bound to the running state machine and so remains a
    // per-request context value rather than an injected dependency.
    @CoreContext() { sendEvent }: CoreContext,
  ): Promise<boolean> {
    const itemRequest = await this.itemRequestService.getItemRequestById(id);

    try {
      if (
        await clearDeduplicationJob(
          "process-item-request",
          `reindex-item-${itemRequest.id}`,
        )
      ) {
        this.logger.silly(
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
          this.logger.silly(
            `Removed jobs for ${item.fullTitle} from the process-media-item queue`,
          );
        }
      }

      await this.itemRequestService.removeItemRequest(itemRequest);

      sendEvent({
        type: "riven.item-request.removed",
        item: itemRequest,
      });

      return true;
    } catch (error) {
      this.logger.error(`Failed to remove item request with ID ${id}`, {
        err: error,
      });

      return false;
    }
  }
}
