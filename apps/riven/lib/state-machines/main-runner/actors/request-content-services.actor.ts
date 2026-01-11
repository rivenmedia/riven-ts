import { fromPromise } from "xstate";

import { requestContentServices } from "../../../message-queue/flows/request-content-services/request-content-services.ts";

import type { ParamsFor, RivenPlugin } from "@repo/util-plugin-sdk";
import type { MediaItemIndexRequestedEvent } from "@repo/util-plugin-sdk/schemas/events/media-item.index.requested.event";

export interface RequestContentServicesInput extends ParamsFor<MediaItemIndexRequestedEvent> {
  subscribers: RivenPlugin[];
}

export const requestContentServicesActor = fromPromise<
  undefined,
  RequestContentServicesInput
>(async ({ input: { subscribers } }) => {
  await requestContentServices(subscribers);
});
