import { MediaItemScrapeRequestedEvent } from "@repo/util-plugin-sdk/schemas/events/media-item.scrape-requested.event";

import { createPluginFlowJob } from "../../utilities/create-flow-plugin-job.ts";
import { flow } from "../producer.ts";
import { createScrapeItemJob } from "./scrape-item.schema.ts";
import { createParseScrapeResultsJob } from "./steps/parse-scrape-results/parse-scrape-results.schema.ts";

import type { RivenPlugin } from "@repo/util-plugin-sdk";

export interface EnqueueScrapeItemInput {
  items: MediaItemScrapeRequestedEvent["item"][];
  subscribers: RivenPlugin[];
}

export function enqueueScrapeItems({
  items,
  subscribers,
}: EnqueueScrapeItemInput) {
  const nodes = items.map((item) => {
    const childNodes = subscribers.map((plugin) =>
      createPluginFlowJob(
        MediaItemScrapeRequestedEvent,
        `Scrape ${item.fullTitle}`,
        plugin.name.description ?? "unknown",
        { item },
        { ignoreDependencyOnFailure: true },
      ),
    );

    return createScrapeItemJob(
      `Scraping ${item.fullTitle}`,
      { id: item.id },
      {
        children: [
          createParseScrapeResultsJob(
            "Sort scrape results",
            { id: item.id },
            { children: childNodes },
          ),
        ],
        opts: {
          deduplication: {
            id: `scrape-item-${item.id.toString()}`,
          },
        },
      },
    );
  });

  return flow.addBulk(nodes);
}
