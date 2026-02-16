import { SerialisedItemRequest } from "../../../utilities/serialisers/serialised-item-request.ts";
import { createFlowProducer } from "../../utilities/create-flow-producer.ts";
import { queueNameFor } from "../../utilities/queue-name-for.ts";

import type { RivenPlugin } from "@repo/util-plugin-sdk";
import type { MediaItemIndexRequestedEvent } from "@repo/util-plugin-sdk/schemas/events/media-item.index.requested.event";
import type { FlowChildJob, FlowJob } from "bullmq";

export async function indexItem(
  item: MediaItemIndexRequestedEvent["item"],
  indexerPlugins: RivenPlugin[],
) {
  const producer = createFlowProducer();

  const childNodes = indexerPlugins.map(
    (plugin) =>
      ({
        name: `${plugin.name.description ?? "unknown"} - Index item request #${item.id.toString()}`,
        queueName: queueNameFor(
          "riven.media-item.index.requested",
          plugin.name.description ?? "unknown",
        ),
        data: {
          item: SerialisedItemRequest.encode(item),
        },
        opts: {
          ignoreDependencyOnFailure: true,
        },
      }) as const satisfies FlowChildJob,
  );

  const rootNode = {
    name: `Indexing item #${item.id.toString()}`,
    queueName: queueNameFor("index-item"),
    children: childNodes,
  } as const satisfies FlowJob;

  return producer.add(rootNode);
}
