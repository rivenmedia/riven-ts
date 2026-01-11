import { database } from "@repo/core-util-database/connection";
import { logger } from "@repo/core-util-logger";
import { MediaItem } from "@repo/util-plugin-sdk/dto/entities/index";

import { Not } from "typeorm";
import { type ActorRef, type Snapshot, fromPromise } from "xstate";

import type { RivenEvent } from "@repo/util-plugin-sdk/events";

export interface RetryLibraryActorInput {
  parentRef: ActorRef<Snapshot<unknown>, RivenEvent>;
}

export const retryLibraryActor = fromPromise<undefined, RetryLibraryActorInput>(
  async ({ input: { parentRef } }) => {
    try {
      const pendingItems = await database.manager.find(MediaItem, {
        select: ["id", "tmdbId", "imdbId", "tvdbId", "state"],
        where: {
          state: Not("Completed"),
        },
      });

      for (const item of pendingItems) {
        switch (item.state) {
          case "Requested": {
            const { id, state, tmdbId, imdbId, tvdbId } = item;

            parentRef.send({
              type: "riven.media-item.index.requested",
              item: {
                id: id,
                state: state,
                tmdbId: tmdbId,
                imdbId: imdbId,
                tvdbId: tvdbId,
              },
            });

            break;
          }
          case "Indexed": {
            console.log({ item });
            parentRef.send({
              type: "riven.media-item.scrape.requested",
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
