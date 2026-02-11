import { type ActorRef, type Snapshot, fromPromise } from "xstate";

import { database } from "../../../database/database.ts";
import { logger } from "../../../utilities/logger/logger.ts";

import type { RivenEvent } from "@repo/util-plugin-sdk/events";

export interface RetryLibraryActorInput {
  parentRef: ActorRef<Snapshot<unknown>, RivenEvent>;
}

export const retryLibraryActor = fromPromise<undefined, RetryLibraryActorInput>(
  async ({ input: { parentRef } }) => {
    try {
      const pendingItems = await database.mediaItem.find(
        {
          state: {
            $ne: "completed",
          },
        },
        {
          populate: ["activeStream", "streams"],
        },
      );

      const pendingRequests = await database.itemRequest.find({
        state: {
          $ne: "completed",
        },
      });

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
              type: "riven.media-item.download.requested",
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
