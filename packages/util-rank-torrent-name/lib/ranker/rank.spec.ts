import { expect, it } from "vitest";

import { parse } from "../parser/parse.ts";
import { rank } from "./rank.ts";
import { DEFAULT_RANKING, createSettings } from "./settings.ts";

const settings = createSettings();

it("should rank a BluRay 1080p movie positively", () => {
  const data = parse("Movie.2024.1080p.BluRay.x264-GROUP");
  const score = rank(data, settings);

  // BluRay (100) + avc (500) = 600
  expect(score).toBeGreaterThan(0);
});

it("should rank a REMUX very highly", () => {
  const data = parse("Movie.2024.1080p.BluRay.REMUX.AVC.DTS-HD.MA.5.1-GROUP");
  const score = rank(data, settings);

  // remux (10000) should dominate
  expect(score).toBeGreaterThan(5000);
});

it("should rank CAM very negatively", () => {
  const data = parse("Movie.2024.CAM-GROUP");
  const score = rank(data, settings);

  expect(score).toBeLessThan(0);
});

it("should return 0 for unknown quality", () => {
  const data = parse("Movie 2024-GROUP");
  const score = rank(data, settings);

  // No quality, no codec -> 0
  expect(score).toBe(0);
});

it("should return 0 for unknown codec", () => {
  const data = parse("Movie 2024 1080p-GROUP");
  const score = rank(data, settings);

  // No codec, no quality -> 0
  expect(score).toBe(0);
});

it("should add HDR score", () => {
  const data = parse("Movie.2024.2160p.WEB-DL.HDR.HEVC-GROUP");
  const score = rank(data, settings);

  // WEB-DL (200) + hevc (500) + HDR (2000)
  expect(score).toBeGreaterThanOrEqual(2700);
});

it("should add preferred patterns bonus", () => {
  const settings = createSettings({ preferred: ["BluRay"] });
  const data = parse("Movie.2024.1080p.BluRay.x264-GROUP");
  const score = rank(data, settings);

  // BluRay (100) + preferred (10000) + codec score
  expect(score).toBeGreaterThanOrEqual(10100);
});

it("should not add preferred bonus if no match", () => {
  const settings = createSettings({ preferred: ["REMUX"] });
  const data = parse("Movie.2024.1080p.WEB-DL.x264-GROUP");
  const score = rank(data, settings);

  expect(score).toBeLessThan(10000);
});

it("should add preferred language bonus", () => {
  const settings = createSettings({ languages: { preferred: ["en"] } });
  const data = parse("Movie.2024.1080p.BluRay.x264-GROUP [English]");
  const score = rank(data, settings);

  expect(score).toBeGreaterThanOrEqual(10000);
});

it("should use custom rank override", () => {
  const settings = createSettings({
    customRanks: {
      quality: { bluray: { fetch: true, rank: 5000 } },
    },
  });
  const data = parse("Movie.2024.1080p.BluRay.x264-GROUP");
  const score = rank(data, settings);

  // Custom bluray (5000) + codec score from ranking model
  expect(score).toBeGreaterThanOrEqual(5000);
});

it("should accept a custom ranking model", () => {
  const data = parse("Movie.2024.1080p.BluRay.x264-GROUP");
  const customModel = { ...DEFAULT_RANKING, bluray: 9999 };
  const score = rank(data, settings, customModel);

  // Custom model bluray (9999) + codec
  expect(score).toBeGreaterThanOrEqual(9999);
});

it("should rank 3D content negatively (bug fix from Python)", () => {
  const data = parse("Movie.2024.3D.1080p.BluRay-GROUP");
  const score = rank(data, settings);

  // threeD (-10000), should be very negative
  expect(score).toBeLessThan(0);
});

it("should score audio formats", () => {
  const data = parse("Movie.2024.1080p.BluRay.TrueHD.Atmos-GROUP");
  const score = rank(data, settings);

  // Should include truehd (2000) and/or atmos (1000)
  expect(score).toBeGreaterThan(0);
});

it("should rank dubbed content negatively", () => {
  const data = parse("Movie.2024.DUBBED.720p.WEB-DL-GROUP");
  const score = rank(data, settings);

  // dubbed (-1000), WEB-DL (200)
  // Total should be negative
  expect(score).toBeLessThan(0);
});
