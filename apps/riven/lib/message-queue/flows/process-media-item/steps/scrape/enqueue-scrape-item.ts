import { MediaItemScrapeRequestedEvent } from "@repo/util-plugin-sdk/schemas/events/media-item.scrape-requested.event";

import { settings } from "../../../../../utilities/settings.ts";
import { createParseScrapeResultsJob } from "../../../../sandboxed-jobs/jobs/parse-scrape-results/parse-scrape-results.schema.ts";
import { createPluginFlowJob } from "../../../../utilities/create-flow-plugin-job.ts";
import { flow } from "../../../producer.ts";
import { createScrapeItemJob } from "./scrape-item.schema.ts";

import type { RivenPlugin } from "@repo/util-plugin-sdk";
import type { ParentOptions } from "bullmq";

export interface EnqueueScrapeItemInput {
  item: MediaItemScrapeRequestedEvent["item"];
  subscribers: RivenPlugin[];
  parent: ParentOptions;
  isRootItem: boolean;
}

export function enqueueScrapeItem({
  item,
  subscribers,
  parent,
  isRootItem,
}: EnqueueScrapeItemInput) {
  const attempts = isRootItem
    ? settings.maximumScrapeAttempts - item.failedScrapeAttempts
    : 1;

  if (attempts <= 0) {
    return null;
  }

  const childNodes = subscribers.map((plugin) =>
    createPluginFlowJob(
      MediaItemScrapeRequestedEvent,
      `Scrape ${item.fullTitle}`,
      plugin.name.description ?? "unknown",
      { item },
      { ignoreDependencyOnFailure: true },
    ),
  );

  const node = createScrapeItemJob(
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
          {
            children: childNodes,
            opts: {
              ignoreDependencyOnFailure: true,
            },
          },
        ),
      ],
      opts: {
        parent,
        continueParentOnFailure: true,
        attempts,
        backoff: {
          type: "custom",
        },
      },
    },
  );

  return flow.add(node);
}
