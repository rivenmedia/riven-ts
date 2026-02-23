import {
  type MediaItem,
  Season,
  Show,
} from "@repo/util-plugin-sdk/dto/entities";

import { fromPromise } from "xstate";

import { database } from "../../../database/database.ts";
import { enqueueScrapeItem } from "../../../message-queue/flows/scrape-item/enqueue-scrape-item.ts";

import type { RivenPlugin } from "@repo/util-plugin-sdk";

export interface FanOutDownloadInput {
  item: MediaItem;
  subscribers: RivenPlugin[];
}

export const fanOutDownload = fromPromise<undefined, FanOutDownloadInput>(
  async ({ input: { item, subscribers } }) => {
    if (item instanceof Show) {
      await database.em.fork().populate(item, ["seasons"]);

      for (const season of item.seasons) {
        await enqueueScrapeItem({
          item: season,
          subscribers,
        });
      }
    }

    if (item instanceof Season) {
      await database.em.fork().populate(item, ["episodes"]);

      for (const episode of item.episodes) {
        await enqueueScrapeItem({
          item: episode,
          subscribers,
        });
      }
    }
  },
);
