import { createFlowProducer } from "../../utilities/create-flow-producer.ts";
import { queueNameFor } from "../../utilities/queue-name-for.ts";

import type { RivenPlugin } from "@repo/util-plugin-sdk";

export async function requestContentServices(
  contentServicePlugins: RivenPlugin[],
) {
  const producer = createFlowProducer();

  return producer.add({
    name: "Request content services",
    queueName: queueNameFor("request-content-services"),
    children: contentServicePlugins.map((plugin) => ({
      name: `${plugin.name.description ?? "unknown"} - Request content service`,
      queueName: queueNameFor(
        "riven.content-service.requested",
        plugin.name.description ?? "unknown",
      ),
    })),
    opts: {
      removeOnComplete: {
        age: 60 * 60,
        count: 1000,
      },
      removeOnFail: {
        age: 24 * 60 * 60,
        count: 5000,
      },
    },
  });
}
