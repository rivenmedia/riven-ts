import {
  type MediaItem,
  Season,
  Show,
} from "@repo/util-plugin-sdk/dto/entities";

import { type ActorRef, type Snapshot, createActor, fromPromise } from "xstate";

import { database } from "../../../database/database.ts";
import { requestScrape } from "./request-scrape.actor.ts";

import type { MainRunnerMachineEvent } from "../index.ts";
import type { RivenPlugin } from "@repo/util-plugin-sdk";

export interface FanOutDownloadInput {
  item: MediaItem;
  subscribers: RivenPlugin[];
  parentRef: ActorRef<Snapshot<unknown>, MainRunnerMachineEvent>;
}

export const fanOutDownload = fromPromise<undefined, FanOutDownloadInput>(
  async ({ input: { item, subscribers, parentRef } }) => {
    if (item instanceof Show) {
      await database.em.fork().populate(item, ["seasons"]);

      for (const season of item.seasons) {
        createActor(requestScrape, {
          input: {
            item: season,
            subscribers,
          },
          parent: parentRef,
        }).start();
      }
    }

    if (item instanceof Season) {
      await database.em.fork().populate(item, ["episodes"]);

      for (const episode of item.episodes) {
        createActor(requestScrape, {
          input: {
            item: episode,
            subscribers,
          },
          parent: parentRef,
        }).start();
      }
    }
  },
);
