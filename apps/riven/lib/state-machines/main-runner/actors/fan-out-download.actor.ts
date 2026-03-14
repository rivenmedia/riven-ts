import {
  type MediaItem,
  Season,
  Show,
} from "@repo/util-plugin-sdk/dto/entities";
import { MediaItemState } from "@repo/util-plugin-sdk/dto/enums/media-item-state.enum";

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
    const processableStates = MediaItemState.extract([
      "ongoing",
      "indexed",
      "scraped",
    ]);

    if (item instanceof Show) {
      await database.em.fork().populate(item, ["seasons"]);

      /**
       * Ignore specials when fanning out.
       *
       * These are unable to be downloaded in most instances,
       * and end up burdening the queue with jobs.
       *
       * They should be handled after the main attempt has resolved.
       */
      const seasons = await item.getStandardSeasons(processableStates.options);

      for (const season of seasons) {
        await enqueueScrapeItem({
          item: season,
          subscribers,
        });
      }
    }

    if (item instanceof Season) {
      await database.em.fork().populate(item, ["episodes"]);

      const incompleteEpisodes = await item.episodes.matching({
        orderBy: { number: "asc" },
        where: { state: { $in: processableStates.options } },
      });

      // TODO: Implement pagination for shows with a large number of episodes to avoid enqueueing thousands of scrape jobs at once
      for (const episode of incompleteEpisodes) {
        await enqueueScrapeItem({
          item: episode,
          subscribers,
        });
      }
    }
  },
);
