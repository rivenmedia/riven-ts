import { Show } from "@repo/util-plugin-sdk/dto/entities";

import { fromPromise } from "xstate";

import {
  type EnqueueScrapeItemInput,
  enqueueScrapeItems,
} from "../../../message-queue/flows/scrape-item/enqueue-scrape-items.ts";

export const requestScrape = fromPromise<undefined, EnqueueScrapeItemInput>(
  async ({ input }) => {
    for (const item of input.items) {
      if (item instanceof Show) {
        const itemsToScrape = await item.seasons.matching({
          where: {
            isRequested: true,
            isSpecial: false,
            state: {
              $nin: ["completed", "unreleased", "paused", "failed"],
            },
          },
        });

        await enqueueScrapeItems({
          items: itemsToScrape,
          subscribers: input.subscribers,
        });

        return;
      }

      await enqueueScrapeItems(input);
    }
  },
);
