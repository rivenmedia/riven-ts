import { SerialisedMediaItem } from "../../../utilities/serialisers/serialised-media-item.ts";
import { createFlowProducer } from "../../utilities/create-flow-producer.ts";
import { queueNameFor } from "../../utilities/queue-name-for.ts";

import type { RivenPlugin } from "@repo/util-plugin-sdk";
import type { MediaItemIndexRequestedEvent } from "@repo/util-plugin-sdk/schemas/events/media-item.index.requested.event";
import type { FlowChildJob, FlowJob } from "bullmq";

export async function indexItem(
  item: MediaItemIndexRequestedEvent["item"],
  indexerPlugins: RivenPlugin[],
) {
  const producer = createFlowProducer("index-item");

  const childNodes = indexerPlugins.map<FlowChildJob>((plugin) => ({
    name: `${plugin.name.description ?? "unknown"} - Index item #${item.id.toString()}`,
    queueName: queueNameFor(
      "riven.media-item.index.requested",
      plugin.name.description ?? "unknown",
    ),
    data: {
      item: SerialisedMediaItem.encode(item),
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
