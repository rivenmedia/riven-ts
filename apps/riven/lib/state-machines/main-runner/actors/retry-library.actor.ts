import { database } from "@repo/core-util-database/connection";
import type { ProgramToPluginEvent } from "@repo/util-plugin-sdk";
import { MediaItem } from "@repo/util-plugin-sdk/dto/entities/index";

import { Not } from "typeorm";
import { type ActorRef, type Snapshot, fromPromise } from "xstate";

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
          case "Requested":
            parentRef.send({
              type: "riven.media-item.creation.success",
              item,
            });
            break;
        }
      }
    } catch (error) {}
  },
);
