import { type FlowChildJob, type FlowJob, FlowProducer } from "bullmq";

import { queueNameFor } from "../../utilities/queue-name-for.ts";

import type { RivenPlugin } from "@repo/util-plugin-sdk";
import type { MediaItemIndexRequestedEvent } from "@repo/util-plugin-sdk/schemas/events/media-item/index-requested";

export async function indexItem(
  item: MediaItemIndexRequestedEvent["item"],
  indexerPlugins: RivenPlugin[],
) {
  const producer = new FlowProducer();

  const childNodes = indexerPlugins.map<FlowChildJob>((plugin) => ({
    name: `${plugin.name.description ?? "unknown"} - Index item #${item.id.toString()}`,
    queueName: queueNameFor(
      "riven.media-item.index.requested",
      plugin.name.description ?? "unknown",
    ),
    data: {
      item,
    },
    opts: {
      ignoreDependencyOnFailure: true,
    },
  }));

  const rootNode = {
    name: `Indexing item #${item.id.toString()}`,
    queueName: queueNameFor("index-item"),
    children: childNodes,
  } as const satisfies FlowJob;

  return producer.add(rootNode);
}
