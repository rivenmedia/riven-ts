import { FlowProducer } from "bullmq";

import type { RivenPlugin } from "@repo/util-plugin-sdk";

export async function requestContentServices(
  contentServicePlugins: RivenPlugin[],
) {
  const producer = new FlowProducer();

  return producer.add({
    name: "Request content services",
    queueName: "request-content-services",
    children: contentServicePlugins.map((plugin) => ({
      name: `${plugin.name.description ?? "unknown"} - Request content service`,
      queueName: `riven.content-service.requested.plugin-${plugin.name.description ?? "unknown"}`,
    })),
  });
}
