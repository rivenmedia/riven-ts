import { SerialisedMediaItem } from "../../../utilities/serialisers/serialised-media-item.ts";
import { createFlowProducer } from "../../utilities/create-flow-producer.ts";
import { queueNameFor } from "../../utilities/queue-name-for.ts";

import type { RivenPlugin } from "@repo/util-plugin-sdk";
import type { MediaItemDownloadRequestedEvent } from "@repo/util-plugin-sdk/schemas/events/media-item.download-requested.event";
import type { FlowChildJob, FlowJob } from "bullmq";

export async function downloadItem(
  item: MediaItemDownloadRequestedEvent["item"],
  downloaderPlugins: RivenPlugin[],
) {
  const producer = createFlowProducer();

  const childNodes = downloaderPlugins.map(
    (plugin) =>
      ({
        name: `${plugin.name.description ?? "unknown"} - Download item #${item.id.toString()}`,
        queueName: queueNameFor(
          "riven.media-item.download.requested",
          plugin.name.description ?? "unknown",
        ),
        data: {
          item: SerialisedMediaItem.encode(item),
        },
        opts: {
          ignoreDependencyOnFailure: true,
        },
      }) as const satisfies FlowChildJob,
  );

  const rootNode = {
    name: `Downloading ${item.title} (ID: ${item.id.toString()})`,
    queueName: queueNameFor("download-item"),
    data: {
      id: item.id,
      title: item.title,
    },
    children: childNodes,
  } as const satisfies FlowJob;

  return producer.add(rootNode);
}
