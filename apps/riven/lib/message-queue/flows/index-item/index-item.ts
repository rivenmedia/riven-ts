import { type FlowJob, FlowProducer } from "bullmq";

import type { RivenPlugin } from "@repo/util-plugin-sdk";
import type { MediaItemIndexRequestedEvent } from "@repo/util-plugin-sdk/schemas/events/media-item/index-requested";

export async function indexItem(
  item: MediaItemIndexRequestedEvent["item"],
  indexerPlugins: RivenPlugin[],
) {
  const producer = new FlowProducer();

  const childNodes = indexerPlugins.map((plugin) => ({
    name: `${plugin.name.description ?? "unknown"} - Index item #${item.id.toString()}`,
    queueName: `riven.media-item.index.requested.plugin-${plugin.name.description ?? "unknown"}`,
    data: {
      item,
    },
    opts: {
      ignoreDependencyOnFailure: true,
    },
  }));

  const rootNode = {
    name: `Indexing item #${item.id.toString()}`,
    queueName: "index-item",
    children: childNodes,
  } as const satisfies FlowJob;

  return producer.add(rootNode);
}
