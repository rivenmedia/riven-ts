import { flow } from "../producer.ts";
import { createDownloadItemJob } from "./download-item.schema.ts";
import { createFindValidTorrentContainerJob } from "./steps/find-valid-torrent-container/find-valid-torrent-container.schema.ts";

import type { RivenPlugin } from "@repo/util-plugin-sdk";
import type { MediaItemDownloadRequestedEvent } from "@repo/util-plugin-sdk/schemas/events/media-item.download-requested.event";

export async function downloadItem(
  item: MediaItemDownloadRequestedEvent["item"],
  downloaderPlugins: RivenPlugin[],
) {
  const findValidTorrentContainerNode = createFindValidTorrentContainerJob(
    `Finding valid torrent container for ${item.title}`,
    {
      id: item.id,
      availableDownloaders: downloaderPlugins.map(
        (plugin) => plugin.name.description ?? "unknown",
      ),
      infoHashes: item.streams.map((stream) => stream.infoHash),
      failedInfoHashes: [],
    },
  );

  const rootNode = createDownloadItemJob(
    `Downloading ${item.title}`,
    { id: item.id },
    { children: [findValidTorrentContainerNode] },
  );

  return flow.add(rootNode);
}
