import { type FlowJob, FlowProducer } from "bullmq";

import type { RivenPlugin } from "@repo/util-plugin-sdk";
import type { MediaItemScrapeRequestedEvent } from "@repo/util-plugin-sdk/schemas/events/media-item/scrape-requested";

export async function scrapeItem(
  item: MediaItemScrapeRequestedEvent["item"],
  scraperPlugins: RivenPlugin[],
) {
  const producer = new FlowProducer();

  const childNodes = scraperPlugins.map((plugin) => ({
    name: `${plugin.name.description ?? "unknown"} - Scrape item #${item.id.toString()}`,
    queueName: `riven.media-item.scrape.requested.plugin-${plugin.name.description ?? "unknown"}`,
    data: {
      item,
    },
    opts: {
      ignoreDependencyOnFailure: true,
    },
  }));

  const rootNode = {
    name: `Scraping item #${item.id.toString()}`,
    queueName: "scrape-item",
    children: [
      {
        name: "Sort scrape results",
        queueName: "sort-scrape-results",
        children: childNodes,
      },
    ],
  } as const satisfies FlowJob;

  return producer.add(rootNode);
}
