import { type FlowJob, FlowProducer } from "bullmq";

import { queueNameFor } from "../../utilities/queue-name-for.ts";

import type { RivenPlugin } from "@repo/util-plugin-sdk";
import type { MediaItemDownloadRequestedEvent } from "@repo/util-plugin-sdk/schemas/events/media-item.download-requested.event";

export async function downloadItem(
  item: MediaItemDownloadRequestedEvent["item"],
  downloaderPlugins: RivenPlugin[],
) {
  const producer = new FlowProducer();

  const childNodes = downloaderPlugins.map((plugin) => ({
    name: `${plugin.name.description ?? "unknown"} - Download item #${item.id.toString()}`,
    queueName: queueNameFor(
      "riven.media-item.download.requested",
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
    name: `Downloading ${item.title ?? "Unknown title"} (ID: ${item.id.toString()})`,
    queueName: queueNameFor("download-item"),
    data: {
      id: item.id,
      title: item.title,
    },
    children: childNodes,
  } as const satisfies FlowJob;

  return producer.add(rootNode);
}
