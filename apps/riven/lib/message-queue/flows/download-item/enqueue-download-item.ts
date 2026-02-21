import {
  type MediaItem,
  ShowLikeMediaItem,
} from "@repo/util-plugin-sdk/dto/entities";

import { flow } from "../producer.ts";
import { createDownloadItemJob } from "./download-item.schema.ts";
import { createFindValidTorrentContainerJob } from "./steps/find-valid-torrent-container/find-valid-torrent-container.schema.ts";

import type { RivenPlugin } from "@repo/util-plugin-sdk";

export interface EnqueueDownloadItemInput {
  item: MediaItem;
  subscribers: RivenPlugin[];
}

export async function enqueueDownloadItem({
  item,
  subscribers,
}: EnqueueDownloadItemInput) {
  const topLevelItem =
    item instanceof ShowLikeMediaItem ? await item.getShow() : item;
  const streams = await topLevelItem.streams.loadItems();

  const findValidTorrentContainerNode = createFindValidTorrentContainerJob(
    `Finding valid torrent container for ${item.title}`,
    {
      id: item.id,
      availableDownloaders: subscribers.map(
        (plugin) => plugin.name.description ?? "unknown",
      ),
      infoHashes: streams.map((stream) => stream.infoHash),
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
