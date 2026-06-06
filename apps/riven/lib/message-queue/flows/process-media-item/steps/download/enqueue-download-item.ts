import { toMerged } from "es-toolkit";

import {
  rtnRankingModel,
  rtnSettings,
} from "../../../../../ranking-config/ranking-config.ts";
import { flow } from "../../../producer.ts";
import { createDownloadItemJob } from "./download-item.schema.ts";
import { createFindValidTorrentJob } from "./steps/find-valid-torrent/find-valid-torrent.schema.ts";
import { createRankStreamsJob } from "./steps/rank-streams/rank-streams.schema.ts";

import type { MediaItem } from "@repo/util-plugin-sdk/dto/entities";
import type { FlowJob } from "bullmq";
import type { PartialDeep, SetRequired } from "type-fest";

export interface EnqueueDownloadItemInput {
  item: MediaItem;
  opts: SetRequired<NonNullable<FlowJob["opts"]>, "parent">;
}

export async function enqueueDownloadItem({
  item,
  opts,
}: EnqueueDownloadItemInput) {
  const streams = await item.streams.loadItems();

  const rankStreamsNode = createRankStreamsJob(
    `Ranking streams for ${item.fullTitle}`,
    {
      id: item.id,
      streams: Object.fromEntries(
        streams.map((stream) => [stream.infoHash, stream.parsedData.rawTitle]),
      ),
      rtnSettings,
      rtnRankingModel,
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
    { id: item.id },
    {
      children: [findValidTorrentNode],
      opts: toMerged<
        NonNullable<FlowJob["opts"]>,
        PartialDeep<NonNullable<FlowJob["opts"]>>
      >(opts, {
        continueParentOnFailure: true,
      }),
    },
  );

  return flow.add(rootNode);
}
