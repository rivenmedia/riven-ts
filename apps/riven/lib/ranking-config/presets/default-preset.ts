import type { RawRankingConfig } from "../ranking-config.schema.ts";
import type { PartialDeep } from "type-fest";

export const defaultPreset =
  //#region default-preset
  {
    rankingModel: {
      // Quality
      av1: 500,
      avc: 500,
      bluray: 100,
      hdtv: -5000,
      hevc: 500,
      remux: 10_000,
      web: 100,
      webdl: 200,

      // Rips
      brrip: -10_000,
      hdrip: -10_000,
      webrip: -1000,

      // HDR
      bit10: 100,
      dolbyVision: 3000,
      hdr: 2000,
      hdr10plus: 2100,
      sdr: 0,

      // Audio
      aac: 100,
      atmos: 1000,
      dolbyDigital: 50,
      dolbyDigitalPlus: 150,
      dtsLossy: 100,
      dtsLossless: 2000,
      flac: 0,
      stereo: 0,
      surround: 0,
      truehd: 2000,

      // Extras
      dubbed: -1000,
      edition: 100,
      hardcoded: 0,
      network: 0,
      proper: 20,
      repack: 20,
      retail: 0,
      subbed: 0,
      scene: 0,
      uncensored: 0,
    },
    settings: {
      resolutions: {
        r2160p: true,
      },
    },
    //#endregion
  } satisfies PartialDeep<RawRankingConfig>;
