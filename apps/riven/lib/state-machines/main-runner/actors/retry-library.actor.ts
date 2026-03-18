import { type ActorRef, type Snapshot, fromPromise } from "xstate";

import { database } from "../../../database/database.ts";
import { logger } from "../../../utilities/logger/logger.ts";

import type { MainRunnerMachineEvent } from "../index.ts";

export interface RetryLibraryActorInput {
  parentRef: ActorRef<Snapshot<unknown>, MainRunnerMachineEvent>;
}

export const retryLibrary = fromPromise<undefined, RetryLibraryActorInput>(
  async ({ input: { parentRef } }) => {
    try {
      logger.verbose("Retrying library items");

      const pendingItems = await database.mediaItem.find(
        {
          isRequested: true,
          state: {
            $ne: "completed",
          },
          type: {
            // Only retry movies and shows, as shows will fan out their seasons and episodes on failure
            $in: ["movie", "show"],
          },
        },
        {
          populate: ["activeStream", "streams"],
          refresh: true,
        },
      );

      const pendingRequests = await database.itemRequest.find(
        {
          state: {
            $ne: "completed",
          },
        },
        { refresh: true },
      );

      console.log(pendingRequests);

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
          type: "riven.media-item.index.requested",
          item: request,
        });
      }

      for (const item of pendingItems) {
        switch (item.state) {
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
      logger.error(error);
    }
  },
);
