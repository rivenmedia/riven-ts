import { it as baseIt } from "vitest";

import {
  createRankingModel,
  createSettings,
} from "../ranking-settings.schema.ts";

export const it = baseIt
  .extend("settings", () => createSettings())
  .extend("rankingModel", () =>
    createRankingModel({
      avc: 0,
      bluray: 0,
      hdtv: 0,
      hevc: 0,
      web: 0,
      webdl: 0,
      brrip: 0,
      hdrip: 0,
      webrip: 0,
      bit10: 0,
      hdr: 0,
      hdr10plus: 0,
      sdr: 0,
      aac: 0,
      atmos: 0,
      dolbyDigital: 0,
      dolbyDigitalPlus: 0,
      dtsLossy: 0,
      dtsLossless: 0,
      flac: 0,
      stereo: 0,
      surround: 0,
      truehd: 0,
      dubbed: 0,
      edition: 0,
      hardcoded: 0,
      network: 0,
      proper: 0,
      repack: 0,
      retail: 0,
      subbed: 0,
      scene: 0,
      uncensored: 0,
    }),
  );
