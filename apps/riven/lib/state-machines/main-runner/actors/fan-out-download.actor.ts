import {
  type MediaItem,
  Season,
  Show,
} from "@repo/util-plugin-sdk/dto/entities";
import { MediaItemState } from "@repo/util-plugin-sdk/dto/enums/media-item-state.enum";

import { fromPromise } from "xstate";

import { database } from "../../../database/database.ts";
import { enqueueScrapeItems } from "../../../message-queue/flows/scrape-item/enqueue-scrape-items.ts";

import type { RivenPlugin } from "@repo/util-plugin-sdk";

const processableStates = MediaItemState.extract([
  "ongoing",
  "indexed",
  "scraped",
]);

export interface FanOutDownloadInput {
  item: MediaItem;
  subscribers: RivenPlugin[];
}

export const fanOutDownload = fromPromise<undefined, FanOutDownloadInput>(
  async ({ input: { item, subscribers } }) => {
    if (item instanceof Show) {
      await database.em.fork().populate(item, ["requestedSeasons"]);

      /**
       * Pulls all *standard* seasons when fanning out.
       *
       * Specials are unable to be downloaded in most instances,
       * and end up burdening the queue with jobs.
       *
       * They should be handled after the main attempt has resolved.
       */
      await enqueueScrapeItems({
        items: item.requestedSeasons.getItems(),
        subscribers,
      });
    }

    if (item instanceof Season) {
      await database.em.fork().populate(item, ["episodes"]);

      const incompleteEpisodes = await item.episodes.matching({
        orderBy: { number: "asc" },
        where: { state: { $in: processableStates.options } },
      });

      // TODO: Implement pagination for shows with a large number of episodes to avoid enqueueing thousands of scrape jobs at once
      await enqueueScrapeItems({
        items: incompleteEpisodes,
        subscribers,
      });
    }
  },
);
