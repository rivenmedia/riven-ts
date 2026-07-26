import { it as baseIt, describe, expect } from "vitest";

import {
  checkFetch,
  createRankingModel,
  createSettings,
  parse,
  rank,
  rankTorrent,
} from "../../index.ts";

const it = baseIt.extend("rankingConfig", () =>
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
);

describe("rankTorrent (integration)", () => {
  it("parses, ranks, and checks fetch in one call", ({ rankingConfig }) => {
    const settings = createSettings();
    const result = rankTorrent(
      "Movie.2024.1080p.BluRay.x264-GROUP",
      "1234567890123456789012345678901234567893",
      "Movie",
      {},
      settings,
      rankingConfig,
    );

    expect(result.data.title).toBe("Movie");
    expect(result.data.resolution).toBe("1080p");
    expect(result.data.quality).toBe("BluRay");
    expect(result.rank).toBeGreaterThan(0);
    expect(result.fetch).toBe(true);
    expect(result.failedChecks).toHaveLength(0);
  });

  it("detects show type", ({ rankingConfig }) => {
    const settings = createSettings();
    const result = rankTorrent(
      "Breaking.Bad.S01E01.720p.BluRay.x264-GROUP",
      "1234567890123456789012345678901234567893",
      "Breaking Bad",
      {},
      settings,
      rankingConfig,
    );

    expect(result.data.type).toBe("show");
    expect(result.data.seasons).toStrictEqual([1]);
    expect(result.data.episodes).toStrictEqual([1]);
  });

  it("works with custom settings", ({ rankingConfig }) => {
    const settings = createSettings({
      require: ["1080p"],
      exclude: ["CAM"],
      preferred: ["BluRay"],
      resolutions: {
        r2160p: true,
      },
      options: {
        removeAllTrash: false,
      },
    });

    // This should match require and get preferred bonus
    const result = rankTorrent(
      "Movie.2024.1080p.BluRay.REMUX.AVC-GROUP",
      "1234567890123456789012345678901234567893",
      "Movie",
      {},
      settings,
      rankingConfig,
    );

    expect(result.fetch).toBe(true);
    expect(result.rank).toBeGreaterThan(10_000); // Preferred bonus
  });

  it("rejects excluded content", ({ rankingConfig }) => {
    const settings = createSettings({
      exclude: ["CAM"],
      options: {
        removeAllTrash: false,
      },
    });
    const result = rankTorrent(
      "Movie.2024.CAM-GROUP",
      "1234567890123456789012345678901234567893",
      "Movie",
      {},
      settings,
      rankingConfig,
    );

    // CAM is both trash and excluded
    expect(result.fetch).toBe(false);
  });
});

describe("public API exports", () => {
  it("exports all expected functions", () => {
    expect(parse).toBeTypeOf("function");
    expect(rank).toBeTypeOf("function");
    expect(checkFetch).toBeTypeOf("function");
    expect(rankTorrent).toBeTypeOf("function");
    expect(createSettings).toBeTypeOf("function");
  });
});
