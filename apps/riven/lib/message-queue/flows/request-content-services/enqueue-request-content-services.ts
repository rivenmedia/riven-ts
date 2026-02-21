import { ContentServiceRequestedEvent } from "@repo/util-plugin-sdk/schemas/events/content-service-requested.event";

import { createPluginFlowJob } from "../../utilities/create-flow-plugin-job.ts";
import { flow } from "../producer.ts";
import { createRequestContentServicesJob } from "./request-content-services.schema.ts";

import type { RivenPlugin } from "@repo/util-plugin-sdk";

export interface EnqueueRequestContentServicesInput {
  subscribers: RivenPlugin[];
}

export async function enqueueRequestContentServices({
  subscribers,
}: EnqueueRequestContentServicesInput) {
  const childNodes = subscribers.map((plugin) =>
    createPluginFlowJob(
      ContentServiceRequestedEvent,
      "Request content service",
      plugin.name.description ?? "unknown",
      {},
      { ignoreDependencyOnFailure: true },
    ),
  );

  const rootNode = createRequestContentServicesJob("Request content services", {
    children: childNodes,
  });

  return flow.add(rootNode);
}
