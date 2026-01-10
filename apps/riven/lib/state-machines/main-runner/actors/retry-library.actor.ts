import { database } from "@repo/core-util-database/connection";
import { logger } from "@repo/core-util-logger";
import { MediaItem } from "@repo/util-plugin-sdk/dto/entities/index";

import { Not } from "typeorm";
import { type ActorRef, type Snapshot, fromPromise } from "xstate";

import type { ProgramToPluginEvent } from "@repo/util-plugin-sdk/program-to-plugin-events";

export interface RetryLibraryActorInput {
  parentRef: ActorRef<Snapshot<unknown>, ProgramToPluginEvent>;
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
            parentRef.send({
              type: "riven.media-item.creation.success",
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
