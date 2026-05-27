import { MediaItemNzbDownloadRequestedEvent } from "@repo/util-plugin-sdk/schemas/events/media-item.nzb-download-requested.event";

import { createPluginFlowJob } from "../../../../utilities/create-flow-plugin-job.ts";
import { flow } from "../../../producer.ts";
import { createNzbDownloadItemJob } from "./nzb-download-item.schema.ts";

import type { RivenPlugin } from "@repo/util-plugin-sdk";
import type { NzbScrapeMediaItemPayload } from "@repo/util-plugin-sdk/schemas/events/media-item.nzb-scrape-requested.event";
import type { ParentOptions } from "bullmq";

export interface EnqueueNzbDownloadItemInput {
  item: NzbScrapeMediaItemPayload;
  nzbUrl: string;
  expectedTitle: string;
  subscribers: RivenPlugin[];
  parent: ParentOptions;
}

/**
 * Enqueues an nzb-download-item flow job with one child plugin job per
 * registered `riven.media-item.nzb-download.requested` subscriber.
 *
 * Each plugin child job hands the NZB URL off to the download client (e.g.
 * plugin-altmount) and returns an altmountId; the parent nzb-download-item
 * processor aggregates and picks the first successful response.
 *
 * When there are zero subscribers the root job will have no children. The
 * processor will then find no successful results, emit a nzb-download.error
 * event, and throw an UnrecoverableError so the item is cleanly parked.
 */
export function enqueueNzbDownloadItem({
  item,
  nzbUrl,
  expectedTitle,
  subscribers,
  parent,
}: EnqueueNzbDownloadItemInput) {
  const childNodes = subscribers.map((plugin) =>
    createPluginFlowJob(
      MediaItemNzbDownloadRequestedEvent,
      `NZB download ${item.title}`,
      plugin.name.description ?? "unknown",
      { item, nzbUrl, expectedTitle },
      { ignoreDependencyOnFailure: true },
    ),
  );

  const node = createNzbDownloadItemJob(
    `NZB downloading ${item.title}`,
    { item, nzbUrl, expectedTitle },
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
