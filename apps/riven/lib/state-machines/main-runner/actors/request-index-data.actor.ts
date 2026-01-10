import { type ActorRef, type Snapshot, fromPromise } from "xstate";

import { createRequestIndexDataFlowJob } from "../../../message-queue/flows/indexing.ts";

import type { ParamsFor, RivenPlugin } from "@repo/util-plugin-sdk";
import type { ProgramToPluginEvent } from "@repo/util-plugin-sdk/program-to-plugin-events";
import type { MediaItemIndexRequestedEvent } from "@repo/util-plugin-sdk/program-to-plugin-events/media-item/index-requested";
import type { FlowProducer } from "bullmq";

export interface RequestIndexDataInput extends ParamsFor<MediaItemIndexRequestedEvent> {
  producer: FlowProducer;
  subscribers: RivenPlugin[];
  parentRef: ActorRef<Snapshot<unknown>, ProgramToPluginEvent>;
}

export const requestIndexData = fromPromise<undefined, RequestIndexDataInput>(
  async ({ input: { item, subscribers } }) => {
    await createRequestIndexDataFlowJob(item, subscribers);
  },
);
