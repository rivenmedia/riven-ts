import {
  createRankingModel,
  createSettings,
} from "@repo/util-rank-torrent-name";

import { toMerged } from "es-toolkit";

import { flow } from "../../../producer.ts";
import { createDownloadItemJob } from "./download-item.schema.ts";
import { createFindValidTorrentJob } from "./steps/find-valid-torrent/find-valid-torrent.schema.ts";
import { createRankStreamsJob } from "./steps/rank-streams/rank-streams.schema.ts";

import type { MediaItem } from "@rivenmedia/plugin-sdk/dto/entities";
import type { FlowJob } from "bullmq";
import type { PartialDeep, SetRequired } from "type-fest";

const rtnSettings = createSettings({
  exclude: ["\\bmatte\\b"],
  preferred: ["\\b4[Kk]|2160p?\\b", "HDR|HDR10"],
  resolutions: {
    r2160p: true,
    r720p: true,
    r480p: true,
  },
  languages: {
    preferred: ["anime"],
  },
  customRanks: {
    quality: {
      av1: { fetch: true },
      remux: { fetch: true },
    },
    rips: {
      bdrip: { fetch: true },
      dvdrip: { fetch: true },
      tvrip: { fetch: true },
      uhdrip: { fetch: true },
      webdlrip: { fetch: true },
    },
    hdr: {
      dolbyVision: { fetch: true },
    },
    extras: {
      documentary: { fetch: true },
      site: { fetch: true },
    },
  },
});

const rtnRankingModel = createRankingModel({
  av1: 0,
  bluray: 500,
  hdtv: 500,
  hevc: 500,
  mpeg: 0,
  remux: 1250,
  web: 150,
  webdl: 1500,
  bdrip: 1000,
  brrip: 0,
  dvdrip: 100,
  hdrip: 0,
  tvrip: 0,
  uhdrip: 0,
  webdlrip: 50,
  webrip: 50,
  bit10: 2750,
  dolbyVision: 3000,
  hdr: 2700,
  hdr10plus: 2800,
  sdr: 2300,
  aac: 1450,
  atmos: 1500,
  dolbyDigital: 1450,
  dolbyDigitalPlus: 1450,
  dtsLossy: 1000,
  dtsLossless: 1450,
  flac: 1100,
  stereo: 1050,
  surround: 1050,
  truehd: 1450,
  documentary: 0,
  edition: 80,
  hardcoded: 50,
  network: 100,
  proper: 300,
  repack: 300,
  retail: 0,
  site: 0,
  subbed: 30,
  scene: 0,
  uncensored: 0,
});

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
