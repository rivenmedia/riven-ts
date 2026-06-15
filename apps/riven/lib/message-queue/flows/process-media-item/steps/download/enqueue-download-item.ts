import { flow } from "../../../producer.ts";
import { createDownloadItemJob } from "./download-item.schema.ts";
import { createFindValidTorrentJob } from "./steps/find-valid-torrent/find-valid-torrent.schema.ts";
import { createRankStreamsJob } from "./steps/rank-streams/rank-streams.schema.ts";

import type { MediaItem, Stream } from "@repo/util-plugin-sdk/dto/entities";
import type { FlowJob } from "bullmq";

export interface EnqueueDownloadItemInput {
  streams: Stream[];
  item: MediaItem;
  opts: NonNullable<FlowJob["opts"]>;
  scrapeSource?: "auto" | "manual";
}

export function enqueueDownloadItem({
  item,
  opts,
  streams,
  scrapeSource = "auto",
}: EnqueueDownloadItemInput) {
  const rankStreamsNode = createRankStreamsJob(
    `Ranking streams for ${item.fullTitle}`,
    {
      id: item.id,
      streams: Object.fromEntries(
        streams.map((stream) => [stream.infoHash, stream.parsedData.rawTitle]),
      ),
      scrapeSource,
    },
  );

  const findValidTorrentNode = createFindValidTorrentJob(
    `Finding valid torrent for ${item.fullTitle}`,
    {
      id: item.id,
      itemTitle: item.fullTitle,
      failedInfoHashes: [],
    },
    {
      opts: {
        continueParentOnFailure: true,
      },
      children: [rankStreamsNode],
    },
  );

  const rootNode = createDownloadItemJob(
    `Downloading ${item.fullTitle}`,
    {
      id: item.id,
      scrapeSource,
    },
    {
      children: [findValidTorrentNode],
      opts: {
        continueParentOnFailure: true,
        ...opts,
      },
    },
  );

  return {
    rootNode,
    enqueue: () => flow.add(rootNode),
  };
}
