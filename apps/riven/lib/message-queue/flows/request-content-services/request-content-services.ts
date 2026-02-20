import { ContentServiceRequestedEvent } from "@repo/util-plugin-sdk/schemas/events/content-service-requested.event";

import { createPluginFlowJob } from "../../utilities/create-flow-plugin-job.ts";
import { flow } from "../producer.ts";
import { createRequestContentServicesJob } from "./request-content-services.schema.ts";

import type { RivenPlugin } from "@repo/util-plugin-sdk";

export async function requestContentServices(
  contentServicePlugins: RivenPlugin[],
) {
  const rootNode = createRequestContentServicesJob("Request content services", {
    children: contentServicePlugins.map((plugin) =>
      createPluginFlowJob(
        ContentServiceRequestedEvent,
        "Request content service",
        plugin.name.description ?? "unknown",
        {},
        { ignoreDependencyOnFailure: true },
      ),
    ),
  });

  return flow.add(rootNode);
}
