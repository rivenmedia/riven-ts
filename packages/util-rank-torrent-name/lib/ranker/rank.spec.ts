import { expect, it } from "vitest";

import { parse } from "../parser/parse.ts";
import { rank } from "./rank.ts";
import { createSettings, defaultRankingModel } from "./settings.ts";

const settings = createSettings();

it("ranks a BluRay 1080p movie positively", () => {
  const data = parse("Movie.2024.1080p.BluRay.x264-GROUP");
  const { totalScore } = rank(data, settings, defaultRankingModel);

  // BluRay (100) + avc (500) = 600
  expect(totalScore).toBeGreaterThan(0);
});

it("ranks a REMUX very highly", () => {
  const data = parse("Movie.2024.1080p.BluRay.REMUX.AVC.DTS-HD.MA.5.1-GROUP");
  const { totalScore } = rank(data, settings, defaultRankingModel);

  // remux (10000) should dominate
  expect(totalScore).toBeGreaterThan(5000);
});

it("ranks CAM very negatively", () => {
  const data = parse("Movie.2024.CAM-GROUP");
  const { totalScore } = rank(data, settings, defaultRankingModel);

  expect(totalScore).toBeLessThan(0);
});

it("returns 0 for unknown quality", () => {
  const data = parse("Movie 2024-GROUP");
  const { totalScore } = rank(data, settings, defaultRankingModel);

  // No quality, no codec -> 0
  expect(totalScore).toBe(0);
});

it("returns 0 for unknown codec", () => {
  const data = parse("Movie 2024 1080p-GROUP");
  const { totalScore } = rank(data, settings, defaultRankingModel);

  // No codec, no quality -> 0
  expect(totalScore).toBe(0);
});

it("adds HDR score", () => {
  const data = parse("Movie.2024.2160p.WEB-DL.HDR.HEVC-GROUP");
  const { totalScore } = rank(data, settings, defaultRankingModel);

  // WEB-DL (200) + hevc (500) + HDR (2000)
  expect(totalScore).toBeGreaterThanOrEqual(2700);
});

it("adds preferred patterns bonus", () => {
  const settings = createSettings({ preferred: ["BluRay"] });
  const data = parse("Movie.2024.1080p.BluRay.x264-GROUP");
  const { totalScore } = rank(data, settings, defaultRankingModel);

  // BluRay (100) + preferred (10000) + codec score
  expect(totalScore).toBeGreaterThanOrEqual(10100);
});

it("does not add preferred bonus if no match", () => {
  const settings = createSettings({ preferred: ["REMUX"] });
  const data = parse("Movie.2024.1080p.WEB-DL.x264-GROUP");
  const { totalScore } = rank(data, settings, defaultRankingModel);

  expect(totalScore).toBeLessThan(10000);
});

it("adds preferred language bonus", () => {
  const settings = createSettings({ languages: { preferred: ["en"] } });
  const data = parse("Movie.2024.1080p.BluRay.x264-GROUP [English]");
  const { totalScore } = rank(data, settings, defaultRankingModel);

  expect(totalScore).toBeGreaterThanOrEqual(10000);
});

it("uses custom rank override", () => {
  const settings = createSettings({
    customRanks: {
      quality: { bluray: { fetch: true, rank: 5000 } },
    },
  });
  const data = parse("Movie.2024.1080p.BluRay.x264-GROUP");
  const { totalScore } = rank(data, settings, defaultRankingModel);

  // Custom bluray (5000) + codec score from ranking model
  expect(totalScore).toBeGreaterThanOrEqual(5000);
});

it("accepts a custom ranking model", () => {
  const data = parse("Movie.2024.1080p.BluRay.x264-GROUP");
  const customModel = { ...defaultRankingModel, bluray: 9999 };
  const { totalScore } = rank(data, settings, customModel);

  // Custom model bluray (9999) + codec
  expect(totalScore).toBeGreaterThanOrEqual(9999);
});

it("ranks 3D content negatively", () => {
  const data = parse("Movie.2024.3D.1080p.BluRay-GROUP");
  const { totalScore } = rank(data, settings, defaultRankingModel);

  // threeD (-10000), should be very negative
  expect(totalScore).toBeLessThan(0);
});

it("scores audio formats", () => {
  const data = parse("Movie.2024.1080p.BluRay.TrueHD.Atmos-GROUP");
  const { totalScore } = rank(data, settings, defaultRankingModel);

  // Should include truehd (2000) and/or atmos (1000)
  expect(totalScore).toBeGreaterThan(0);
});

it("ranks dubbed content negatively", () => {
  const data = parse("Movie.2024.DUBBED.720p.WEB-DL-GROUP");
  const { totalScore } = rank(data, settings, defaultRankingModel);

  // dubbed (-1000), WEB-DL (200)
  // Total should be negative
  expect(totalScore).toBeLessThan(0);
});
