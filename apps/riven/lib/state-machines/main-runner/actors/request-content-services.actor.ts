import { fromPromise } from "xstate";

import { requestContentServices } from "../../../message-queue/flows/request-content-services.ts";

import type { ParamsFor, RivenPlugin } from "@repo/util-plugin-sdk";
import type { MediaItemIndexRequestedEvent } from "@repo/util-plugin-sdk/program-to-plugin-events/media-item/index-requested";

export interface RequestContentServicesInput extends ParamsFor<MediaItemIndexRequestedEvent> {
  subscribers: RivenPlugin[];
}

export const requestContentServicesActor = fromPromise<
  undefined,
  RequestContentServicesInput
>(async ({ input: { subscribers } }) => {
  await requestContentServices(subscribers);
});
