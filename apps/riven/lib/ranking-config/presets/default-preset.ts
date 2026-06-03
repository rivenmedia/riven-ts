import {
  createRankingModel,
  createSettings,
} from "@repo/util-rank-torrent-name";

import type { RankingConfigBase } from "../ranking-config.schema.ts";

export const defaultPreset = {
  rankingModel: createRankingModel(
    //#region default-preset
    {
      // Quality
      av1: 500,
      avc: 500,
      bluray: 100,
      dvd: -5000,
      hdtv: -5000,
      hevc: 500,
      mpeg: -1000,
      remux: 10000,
      vhs: -10000,
      web: 100,
      webdl: 200,
      webmux: -10000,
      xvid: -10000,
      pdtv: -10000,

      // Rips
      bdrip: -5000,
      brrip: -10000,
      dvdrip: -5000,
      hdrip: -10000,
      ppvrip: -10000,
      tvrip: -10000,
      uhdrip: -5000,
      vhsrip: -10000,
      webdlrip: -10000,
      webrip: -1000,

      // HDR
      bit10: 100,
      dolbyVision: 3000,
      hdr: 2000,
      hdr10plus: 2100,

      // Audio
      aac: 100,
      atmos: 1000,
      dolbyDigital: 50,
      dolbyDigitalPlus: 150,
      dtsLossy: 100,
      dtsLossless: 2000,
      mp3: -1000,
      truehd: 2000,

      // Extras
      threeD: -10000,
      converted: -1000,
      documentary: -250,
      dubbed: -1000,
      edition: 100,
      proper: 20,
      repack: 20,
      site: -10000,
      upscaled: -10000,

      // Trash
      cam: -10000,
      cleanAudio: -10000,
      r5: -10000,
      satrip: -10000,
      screener: -10000,
      size: -10000,
      telecine: -10000,
      telesync: -10000,
    },
    //#endregion default-preset
  ),
  settings: createSettings(),
} satisfies RankingConfigBase;
