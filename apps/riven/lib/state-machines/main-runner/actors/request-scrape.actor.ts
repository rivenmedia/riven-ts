import { fromPromise } from "xstate";

import {
  type EnqueueScrapeItemInput,
  enqueueScrapeItem,
} from "../../../message-queue/flows/scrape-item/enqueue-scrape-item.ts";

export const requestScrape = fromPromise<undefined, EnqueueScrapeItemInput>(
  async ({ input }) => {
    await enqueueScrapeItem(input);
  },
);
