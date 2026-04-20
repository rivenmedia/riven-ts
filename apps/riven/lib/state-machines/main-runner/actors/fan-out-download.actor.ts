import {
  type MediaItem,
  Season,
  Show,
} from "@repo/util-plugin-sdk/dto/entities";

import { fromPromise } from "xstate";

import { enqueueProcessMediaItem } from "../../../message-queue/flows/process-media-item/enqueue-process-media-item.ts";

export interface FanOutDownloadInput {
  item: MediaItem;
}

export const fanOutDownload = fromPromise<undefined, FanOutDownloadInput>(
  async ({ input: { item } }) => {
    if (item instanceof Show) {
      const requestedSeasons = await item.requestedSeasons.loadItems({
        where: {
          isSpecial: false,
        },
      });

      /**
       * Pulls all *standard* seasons when fanning out.
       *
       * Specials are unable to be downloaded in most instances,
       * and end up burdening the queue with jobs.
       *
       * They should be handled after the main attempt has resolved.
       */
      for (const requestedSeason of requestedSeasons) {
        await enqueueProcessMediaItem(
          { item: requestedSeason },
          { lifo: true },
        );
      }
    }

    if (item instanceof Season) {
      const incompleteEpisodes = await item.episodes.matching({
        orderBy: { number: "asc" },
        where: { state: { $in: ["ongoing", "indexed", "scraped"] } },
      });

      // TODO: Implement pagination for shows with a large number of episodes to avoid enqueueing thousands of scrape jobs at once
      for (const episode of incompleteEpisodes) {
        await enqueueProcessMediaItem({ item: episode }, { lifo: true });
      }
    }
  },
);
