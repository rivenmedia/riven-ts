import { type ActorRef, type Snapshot, fromPromise } from "xstate";

import { indexItem } from "../../../message-queue/flows/index-item/index-item.ts";

import type { ParamsFor, RivenPlugin } from "@repo/util-plugin-sdk";
import type { RivenEvent } from "@repo/util-plugin-sdk/events";
import type { MediaItemIndexRequestedEvent } from "@repo/util-plugin-sdk/schemas/events/media-item.index.requested.event";

export interface RequestIndexDataInput extends ParamsFor<MediaItemIndexRequestedEvent> {
  subscribers: RivenPlugin[];
  parentRef: ActorRef<Snapshot<unknown>, RivenEvent>;
}

export const requestIndexData = fromPromise<undefined, RequestIndexDataInput>(
  async ({ input: { item, subscribers } }) => {
    await indexItem(item, subscribers);
  },
);
