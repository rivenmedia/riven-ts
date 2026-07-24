import { it as baseIt, expect } from "vitest";

import { parse } from "../parser/parse.ts";
import { rank } from "./rank.ts";
import {
  createRankingModel,
  createSettings,
} from "./ranking-settings.schema.ts";

const it = baseIt
  .extend("rankingConfig", () =>
    createRankingModel({
      // Quality
      av1: 500,
      avc: 500,
      bluray: 100,
      dvd: -5000,
      hdtv: -5000,
      hevc: 500,
      mpeg: -1000,
      remux: 10_000,
      vhs: -10_000,
      web: 100,
      webdl: 200,
      webmux: -10_000,
      xvid: -10_000,
      pdtv: -10_000,

      // Rips
      bdrip: -5000,
      brrip: -10_000,
      dvdrip: -5000,
      hdrip: -10_000,
      ppvrip: -10_000,
      tvrip: -10_000,
      uhdrip: -5000,
      vhsrip: -10_000,
      webdlrip: -10_000,
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
      threeD: -10_000,
      converted: -1000,
      documentary: -250,
      dubbed: -1000,
      edition: 100,
      proper: 20,
      repack: 20,
      site: -10_000,
      upscaled: -10_000,

      // Trash
      cam: -10_000,
      cleanAudio: -10_000,
      r5: -10_000,
      satrip: -10_000,
      screener: -10_000,
      size: -10_000,
      telecine: -10_000,
      telesync: -10_000,
    }),
  )
  .extend("settings", () => createSettings());

it("ranks a BluRay 1080p movie positively", ({ rankingConfig, settings }) => {
  const data = parse("Movie.2024.1080p.BluRay.x264-GROUP");
  const { totalScore } = rank(data, settings, rankingConfig);

  // BluRay (100) + avc (500) = 600
  expect(totalScore).toBeGreaterThan(0);
});

it("ranks a REMUX very highly", ({ rankingConfig, settings }) => {
  const data = parse("Movie.2024.1080p.BluRay.REMUX.AVC.DTS-HD.MA.5.1-GROUP");
  const { totalScore } = rank(data, settings, rankingConfig);

  // Remux (10000) should dominate
  expect(totalScore).toBeGreaterThan(5000);
});

it("ranks CAM very negatively", ({ rankingConfig, settings }) => {
  const data = parse("Movie.2024.CAM-GROUP");
  const { totalScore } = rank(data, settings, rankingConfig);

  expect(totalScore).toBeLessThan(0);
});

it("returns 0 for unknown quality", ({ rankingConfig, settings }) => {
  const data = parse("Movie 2024-GROUP");
  const { totalScore } = rank(data, settings, rankingConfig);

  // No quality, no codec -> 0
  expect(totalScore).toBe(0);
});

it("returns 0 for unknown codec", ({ rankingConfig, settings }) => {
  const data = parse("Movie 2024 1080p-GROUP");
  const { totalScore } = rank(data, settings, rankingConfig);

  // No codec, no quality -> 0
  expect(totalScore).toBe(0);
});

it("adds HDR score", ({ rankingConfig, settings }) => {
  const data = parse("Movie.2024.2160p.WEB-DL.HDR.HEVC-GROUP");
  const { totalScore } = rank(data, settings, rankingConfig);

  // WEB-DL (200) + hevc (500) + HDR (2000)
  expect(totalScore).toBeGreaterThanOrEqual(2700);
});

it("adds preferred patterns bonus", ({ rankingConfig }) => {
  const settings = createSettings({ preferred: ["BluRay"] });
  const data = parse("Movie.2024.1080p.BluRay.x264-GROUP");
  const { totalScore } = rank(data, settings, rankingConfig);

  // BluRay (100) + preferred (10000) + codec score
  expect(totalScore).toBeGreaterThanOrEqual(10_100);
});

it("does not add preferred bonus if no match", ({ rankingConfig }) => {
  const settings = createSettings({ preferred: ["REMUX"] });
  const data = parse("Movie.2024.1080p.WEB-DL.x264-GROUP");
  const { totalScore } = rank(data, settings, rankingConfig);

  expect(totalScore).toBeLessThan(10_000);
});

it("adds preferred language bonus", ({ rankingConfig }) => {
  const settings = createSettings({ languages: { preferred: ["en"] } });
  const data = parse("Movie.2024.1080p.BluRay.x264-GROUP [English]");
  const { totalScore } = rank(data, settings, rankingConfig);

  expect(totalScore).toBeGreaterThanOrEqual(10_000);
});

it("accepts a custom ranking model", ({ rankingConfig, settings }) => {
  const data = parse("Movie.2024.1080p.BluRay.x264-GROUP");
  const customModel = { ...rankingConfig, bluray: 9999 };
  const { totalScore } = rank(data, settings, customModel);

  // Custom model bluray (9999) + codec
  expect(totalScore).toBeGreaterThanOrEqual(9999);
});

it("ranks 3D content negatively", ({ rankingConfig, settings }) => {
  const data = parse("Movie.2024.3D.1080p.BluRay-GROUP");
  const { totalScore } = rank(data, settings, rankingConfig);

  // ThreeD (-10000), should be very negative
  expect(totalScore).toBeLessThan(0);
});

it("scores audio formats", ({ rankingConfig, settings }) => {
  const data = parse("Movie.2024.1080p.BluRay.TrueHD.Atmos-GROUP");
  const { totalScore } = rank(data, settings, rankingConfig);

  // Should include truehd (2000) and/or atmos (1000)
  expect(totalScore).toBeGreaterThan(0);
});

it("ranks dubbed content negatively", ({ rankingConfig, settings }) => {
  const data = parse("Movie.2024.DUBBED.720p.WEB-DL-GROUP");
  const { totalScore } = rank(data, settings, rankingConfig);

  // Dubbed (-1000), WEB-DL (200)
  // Total should be negative
  expect(totalScore).toBeLessThan(0);
});
