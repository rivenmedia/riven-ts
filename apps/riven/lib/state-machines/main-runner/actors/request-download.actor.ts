import { type ActorRef, type Snapshot, fromPromise } from "xstate";

import { downloadItem } from "../../../message-queue/flows/download-item/download-item.ts";

import type { ParamsFor, RivenPlugin } from "@repo/util-plugin-sdk";
import type { RivenEvent } from "@repo/util-plugin-sdk/events";
import type { MediaItemScrapeRequestedEvent } from "@repo/util-plugin-sdk/schemas/events/media-item.scrape-requested.event";

export interface RequestScrapeInput extends ParamsFor<MediaItemScrapeRequestedEvent> {
  subscribers: RivenPlugin[];
  parentRef: ActorRef<Snapshot<unknown>, RivenEvent>;
}

export const requestDownload = fromPromise<undefined, RequestScrapeInput>(
  async ({ input: { item, subscribers } }) => {
    await downloadItem(item, subscribers);
  },
);
