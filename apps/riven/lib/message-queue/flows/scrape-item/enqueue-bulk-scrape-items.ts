import { MediaItemScrapeRequestedEvent } from "@repo/util-plugin-sdk/schemas/events/media-item.scrape-requested.event";

import { createPluginFlowJob } from "../../utilities/create-flow-plugin-job.ts";
import { flow } from "../producer.ts";
import { createScrapeItemJob } from "./scrape-item.schema.ts";
import { createParseScrapeResultsJob } from "./steps/parse-scrape-results/parse-scrape-results.schema.ts";

import type { RivenPlugin } from "@repo/util-plugin-sdk";
import type { FlowJob } from "bullmq";

export interface EnqueueBulkScrapeItemsInput {
  items: MediaItemScrapeRequestedEvent["item"][];
  subscribers: RivenPlugin[];
}

export async function enqueueBulkScrapeItems({
  items,
  subscribers,
}: EnqueueBulkScrapeItemsInput) {
  const nodes: FlowJob[] = [];

  for (const item of items) {
    const childNodes = subscribers.map((plugin) =>
      createPluginFlowJob(
        MediaItemScrapeRequestedEvent,
        `Scrape ${item.fullTitle}`,
        plugin.name.description ?? "unknown",
        { item },
        { ignoreDependencyOnFailure: true },
      ),
    );

    const rootNode = createScrapeItemJob(
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
      },
    );

    nodes.push(rootNode);
  }

  return flow.addBulk(nodes);
}
