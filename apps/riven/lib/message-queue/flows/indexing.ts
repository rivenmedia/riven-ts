import { FlowProducer } from "bullmq";

import type { RivenPlugin } from "@repo/util-plugin-sdk";
import type { MediaItemIndexRequestedEvent } from "@repo/util-plugin-sdk/program-to-plugin-events/media-item/index-requested";

export async function createRequestIndexDataFlowJob(
  item: MediaItemIndexRequestedEvent["item"],
  indexerPlugins: RivenPlugin[],
) {
  const producer = new FlowProducer();

  return producer.add({
    name: `Indexing item #${item.id.toString()}`,
    queueName: "indexing",
    children: indexerPlugins.map((plugin) => ({
      name: `${plugin.name.description ?? "unknown"} - Index item #${item.id.toString()}`,
      queueName: `riven.media-item.index.requested.plugin-${plugin.name.description ?? "unknown"}`,
      data: {
        item,
      },
      opts: {
        ignoreDependencyOnFailure: true,
      },
    })),
  });
}
