import { Show } from "@repo/util-plugin-sdk/dto/entities";

import { wrap } from "@mikro-orm/core";
import { fromPromise } from "xstate";

import {
  type EnqueueScrapeItemInput,
  enqueueScrapeItems,
} from "../../../message-queue/flows/scrape-item/enqueue-scrape-items.ts";

export const requestScrape = fromPromise<undefined, EnqueueScrapeItemInput>(
  async ({ input }) => {
    for (const item of input.items) {
      if (item instanceof Show) {
        await wrap(item).populate(["requestedSeasons"], {
          refresh: true,
        });

        await enqueueScrapeItems({
          items: item.requestedSeasons.getItems(),
          subscribers: input.subscribers,
        });

        return;
      }

      await enqueueScrapeItems(input);
    }
  },
);
