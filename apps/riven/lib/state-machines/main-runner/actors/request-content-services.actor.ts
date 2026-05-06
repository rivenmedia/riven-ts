import { fromPromise } from "xstate";

import { enqueueRequestContentService } from "../../../message-queue/flows/request-content-service/enqueue-request-content-service.ts";
import { getPluginEventSubscribers } from "../utilities/get-plugin-event-subscribers.ts";

import type { ValidPluginMap } from "../../../types/plugins.ts";

export interface RequestContentServicesInput {
  plugins: ValidPluginMap;
}

export const requestContentServices = fromPromise<
  undefined,
  RequestContentServicesInput
>(async ({ input: { plugins } }) => {
  const subscribers = getPluginEventSubscribers(
    "riven/content-service.requested",
    plugins,
  );

  for (const subscriber of subscribers) {
    if (!subscriber.name.description) {
      continue;
    }

    await enqueueRequestContentService(subscriber.name.description);
  }
});
