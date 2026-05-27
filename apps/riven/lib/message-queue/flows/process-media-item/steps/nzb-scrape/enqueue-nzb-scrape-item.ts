import { MediaItemNzbScrapeRequestedEvent } from "@repo/util-plugin-sdk/schemas/events/media-item.nzb-scrape-requested.event";

import { createPluginFlowJob } from "../../../../utilities/create-flow-plugin-job.ts";
import { flow } from "../../../producer.ts";
import { createNzbScrapeItemJob } from "./nzb-scrape-item.schema.ts";

import type { RivenPlugin } from "@repo/util-plugin-sdk";
import type { NzbScrapeMediaItemPayload } from "@repo/util-plugin-sdk/schemas/events/media-item.nzb-scrape-requested.event";
import type { ParentOptions } from "bullmq";

export interface EnqueueNzbScrapeItemInput {
  item: NzbScrapeMediaItemPayload;
  subscribers: RivenPlugin[];
  parent: ParentOptions;
}

/**
 * Enqueues an nzb-scrape-item flow job with one child plugin job per
 * registered `riven.media-item.nzb-scrape.requested` subscriber.
 *
 * Each plugin child job will call the indexer and return candidates;
 * the parent nzb-scrape-item processor aggregates and picks the best.
 */
export function enqueueNzbScrapeItem({
  item,
  subscribers,
  parent,
}: EnqueueNzbScrapeItemInput) {
  const childNodes = subscribers.map((plugin) =>
    createPluginFlowJob(
      MediaItemNzbScrapeRequestedEvent,
      `NZB scrape ${item.title}`,
      plugin.name.description ?? "unknown",
      { item },
      { ignoreDependencyOnFailure: true },
    ),
  );

  const node = createNzbScrapeItemJob(
    `NZB scraping ${item.title}`,
    { id: item.id },
    {
      children: childNodes,
      opts: {
        parent,
        continueParentOnFailure: true,
      },
    },
  );

  return flow.add(node);
}
