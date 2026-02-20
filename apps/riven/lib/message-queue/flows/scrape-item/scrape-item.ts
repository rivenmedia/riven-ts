import { MediaItemScrapeRequestedEvent } from "@repo/util-plugin-sdk/schemas/events/media-item.scrape-requested.event";

import { createPluginFlowJob } from "../../utilities/create-flow-plugin-job.ts";
import { flow } from "../producer.ts";
import { createScrapeItemJob } from "./scrape-item.schema.ts";
import { createSortScrapeResultsJob } from "./steps/sort-scrape-results/sort-scrape-results.schema.ts";

import type { RivenPlugin } from "@repo/util-plugin-sdk";

export async function scrapeItem(
  item: MediaItemScrapeRequestedEvent["item"],
  scraperPlugins: RivenPlugin[],
) {
  const childNodes = scraperPlugins.map((plugin) =>
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
        createSortScrapeResultsJob(
          "Sort scrape results",
          { id: item.id },
          { children: childNodes },
        ),
      ],
    },
  );

  return flow.add(rootNode);
}
