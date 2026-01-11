import { type FlowJob, FlowProducer } from "bullmq";

import { queueNameFor } from "../../utilities/queue-name-for.ts";

import type { RivenPlugin } from "@repo/util-plugin-sdk";
import type { MediaItemScrapeRequestedEvent } from "@repo/util-plugin-sdk/schemas/events/media-item.scrape-requested.event";

export async function scrapeItem(
  item: MediaItemScrapeRequestedEvent["item"],
  scraperPlugins: RivenPlugin[],
) {
  const producer = new FlowProducer();

  const childNodes = scraperPlugins.map((plugin) => ({
    name: `${plugin.name.description ?? "unknown"} - Scrape item #${item.id.toString()}`,
    queueName: queueNameFor(
      "riven.media-item.scrape.requested",
      plugin.name.description ?? "unknown",
    ),
    data: {
      item,
    },
    opts: {
      ignoreDependencyOnFailure: true,
    },
  }));

  const rootNode = {
    name: `Scraping item #${item.id.toString()}`,
    queueName: queueNameFor("scrape-item"),
    data: {
      id: item.id,
      title: item.title,
    },
    children: [
      {
        name: "Sort scrape results",
        queueName: queueNameFor("sort-scrape-results"),
        data: {
          id: item.id,
          title: item.title,
        },
        children: childNodes,
      },
    ],
  } as const satisfies FlowJob;

  return producer.add(rootNode);
}
