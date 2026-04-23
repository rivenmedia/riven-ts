import { MediaItemScrapeRequestedEvent } from "@repo/util-plugin-sdk/schemas/events/media-item.scrape-requested.event";

import { settings } from "../../../../../utilities/settings.ts";
import { createParseScrapeResultsJob } from "../../../../sandboxed-jobs/jobs/parse-scrape-results/parse-scrape-results.schema.ts";
import { createPluginFlowJob } from "../../../../utilities/create-flow-plugin-job.ts";
import { flow } from "../../../producer.ts";
import { createScrapeItemJob } from "./scrape-item.schema.ts";

import type { RivenPlugin } from "@repo/util-plugin-sdk";
import type { ParentOptions } from "bullmq";

export interface EnqueueScrapeItemInput {
  items: MediaItemScrapeRequestedEvent["item"][];
  subscribers: RivenPlugin[];
  parent: ParentOptions;
}

export function enqueueScrapeItems({
  items,
  subscribers,
  parent,
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

    const remainingScrapeAttempts =
      settings.maximumScrapeAttempts - item.failedScrapeAttempts;

    return createScrapeItemJob(
      `Scraping ${item.fullTitle}`,
      { id: item.id },
      {
        children: [
          createParseScrapeResultsJob(
            "Parse scrape results",
            {
              id: item.id,
              title: item.fullTitle,
            },
            { children: childNodes },
          ),
        ],
        opts: {
          parent,
          continueParentOnFailure: true,
          attempts: remainingScrapeAttempts,
          backoff: {
            type: "custom",
          },
        },
      },
    );
  });

  return flow.addBulk(nodes);
}
