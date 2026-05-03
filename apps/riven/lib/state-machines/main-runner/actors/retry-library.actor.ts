import { type ActorRef, type Snapshot, fromPromise } from "xstate";

import { services } from "../../../database/database.ts";
import { logger } from "../../../utilities/logger/logger.ts";

import type { MainRunnerMachineEvent } from "../index.ts";

export interface RetryLibraryActorInput {
  parentRef: ActorRef<Snapshot<unknown>, MainRunnerMachineEvent>;
}

export const retryLibrary = fromPromise<undefined, RetryLibraryActorInput>(
  async ({ input: { parentRef } }) => {
    try {
      logger.verbose("Retrying library items");

      const pendingItems =
        await services.retryLibraryService.getMediaItemsToRetry();

      const pendingRequests =
        await services.retryLibraryService.getItemRequestsToRetry();

      if (pendingItems.length === 0 && pendingRequests.length === 0) {
        logger.verbose("No pending library items to retry");

        return;
      }

      if (pendingItems.length > 0) {
        logger.verbose(
          `Found ${pendingItems.length.toString()} pending library items to retry`,
        );
      }

      if (pendingRequests.length > 0) {
        logger.verbose(
          `Found ${pendingRequests.length.toString()} pending item requests to retry`,
        );
      }

      for (const request of pendingRequests) {
        parentRef.send({
          type: `riven.media-item.index.requested.${request.type}`,
          item: request,
        });
      }

      for (const item of pendingItems) {
        switch (item.state) {
          case "partially_completed":
          case "indexed": {
            parentRef.send({
              type: "riven.media-item.scrape.requested",
              item,
            });

            break;
          }
          case "scraped": {
            parentRef.send({
              type: "riven-internal.retry-item-download",
              item,
            });

            break;
          }
        }
      }
    } catch (error) {
      logger.error("Error retrying library", { err: error });
    }
  },
);
