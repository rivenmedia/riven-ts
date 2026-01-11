import { type ActorRef, type Snapshot, fromPromise } from "xstate";

import { scrapeItem } from "../../../message-queue/flows/scrape-item/scrape-item.ts";

import type { ParamsFor, RivenPlugin } from "@repo/util-plugin-sdk";
import type { RivenEvent } from "@repo/util-plugin-sdk/events";
import type { MediaItemScrapeRequestedEvent } from "@repo/util-plugin-sdk/schemas/events/media-item.scrape-requested.event";
import type { FlowProducer } from "bullmq";

export interface RequestScrapeInput extends ParamsFor<MediaItemScrapeRequestedEvent> {
  producer: FlowProducer;
  subscribers: RivenPlugin[];
  parentRef: ActorRef<Snapshot<unknown>, RivenEvent>;
}

export const requestScrape = fromPromise<undefined, RequestScrapeInput>(
  async ({ input: { item, subscribers } }) => {
    await scrapeItem(item, subscribers);
  },
);
