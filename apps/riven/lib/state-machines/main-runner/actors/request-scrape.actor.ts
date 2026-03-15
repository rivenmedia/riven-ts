import { Show } from "@repo/util-plugin-sdk/dto/entities";

import { wrap } from "@mikro-orm/core";
import { fromPromise } from "xstate";

import { enqueueBulkScrapeItems } from "../../../message-queue/flows/scrape-item/enqueue-bulk-scrape-items.ts";
import {
  type EnqueueScrapeItemInput,
  enqueueScrapeItem,
} from "../../../message-queue/flows/scrape-item/enqueue-scrape-item.ts";

export const requestScrape = fromPromise<undefined, EnqueueScrapeItemInput>(
  async ({ input }) => {
    if (input.item instanceof Show) {
      await wrap(input.item).populate(["requestedSeasons"], {
        refresh: true,
      });

      console.log(input.item.requestedSeasons);

      await enqueueBulkScrapeItems({
        items: input.item.requestedSeasons.getItems(),
        subscribers: input.subscribers,
      });

      return;
    }

    await enqueueScrapeItem(input);
  },
);
