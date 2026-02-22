import { MediaItemScrapeRequestedEvent } from "@repo/util-plugin-sdk/schemas/events/media-item.scrape-requested.event";

import { createPluginFlowJob } from "../../utilities/create-flow-plugin-job.ts";
import { flow } from "../producer.ts";
import { createScrapeItemJob } from "./scrape-item.schema.ts";
import { createParseScrapeResultsJob } from "./steps/parse-scrape-results/parse-scrape-results.schema.ts";

import type { RivenPlugin } from "@repo/util-plugin-sdk";

export interface EnqueueScrapeItemInput {
  item: MediaItemScrapeRequestedEvent["item"];
  subscribers: RivenPlugin[];
}

export async function enqueueScrapeItem({
  item,
  subscribers,
}: EnqueueScrapeItemInput) {
  const childNodes = subscribers.map((plugin) =>
    createPluginFlowJob(
      MediaItemScrapeRequestedEvent,
      `Scrape ${item.title}`,
      plugin.name.description ?? "unknown",
      { item },
      { ignoreDependencyOnFailure: true },
    ),
  );

  const rootNode = createScrapeItemJob(
    `Scraping ${item.title}`,
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

  return flow.add(rootNode);
}
