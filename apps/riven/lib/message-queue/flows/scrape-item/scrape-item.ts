import { SerialisedMediaItem } from "../../../utilities/serialisers/serialised-media-item.ts";
import { createFlowProducer } from "../../utilities/create-flow-producer.ts";
import { queueNameFor } from "../../utilities/queue-name-for.ts";

import type { RivenPlugin } from "@repo/util-plugin-sdk";
import type { MediaItemScrapeRequestedEvent } from "@repo/util-plugin-sdk/schemas/events/media-item.scrape-requested.event";
import type { FlowChildJob, FlowJob } from "bullmq";

export async function scrapeItem(
  item: MediaItemScrapeRequestedEvent["item"],
  scraperPlugins: RivenPlugin[],
) {
  const producer = createFlowProducer();

  const childNodes = scraperPlugins.map(
    (plugin) =>
      ({
        name: `${plugin.name.description ?? "unknown"} - Scrape item #${item.id.toString()}`,
        queueName: queueNameFor(
          "riven.media-item.scrape.requested",
          plugin.name.description ?? "unknown",
        ),
        data: {
          item: SerialisedMediaItem.encode(item),
        },
        opts: {
          ignoreDependencyOnFailure: true,
        },
      }) as const satisfies FlowChildJob,
  );

  const rootNode = {
    name: `Scraping item #${item.id.toString()}`,
    queueName: queueNameFor("scrape-item"),
    data: {
      id: item.id,
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
