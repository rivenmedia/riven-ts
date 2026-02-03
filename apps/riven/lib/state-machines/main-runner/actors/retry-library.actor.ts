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
            $ne: "Completed",
          },
        },
        {
          populate: ["activeStream", "streams"],
        },
      );

      for (const item of pendingItems) {
        switch (item.state) {
          case "Requested": {
            parentRef.send({
              type: "riven.media-item.index.requested",
              item,
            });

            break;
          }
          case "Indexed": {
            parentRef.send({
              type: "riven.media-item.scrape.requested",
              item,
            });

            break;
          }
          case "Scraped": {
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
