import { describe, expect, it } from "vitest";

import {
  checkFetch,
  createSettings,
  parse,
  rank,
  rankTorrent,
} from "../../index.ts";

describe("rankTorrent (integration)", () => {
  it("parses, ranks, and checks fetch in one call", () => {
    const settings = createSettings();
    const result = rankTorrent(
      "Movie.2024.1080p.BluRay.x264-GROUP",
      "1234567890123456789012345678901234567893",
      "Movie",
      settings,
    );

    expect(result.data.title).toBe("Movie");
    expect(result.data.resolution).toBe("1080p");
    expect(result.data.quality).toBe("BluRay");
    expect(result.rank).toBeGreaterThan(0);
    expect(result.fetch).toBe(true);
    expect(result.failedChecks).toHaveLength(0);
  });

  it("detects show type", () => {
    const settings = createSettings();
    const result = rankTorrent(
      "Breaking.Bad.S01E01.720p.BluRay.x264-GROUP",
      "1234567890123456789012345678901234567893",
      "Breaking Bad",
      settings,
    );

    expect(result.data.type).toBe("show");
    expect(result.data.seasons).toEqual([1]);
    expect(result.data.episodes).toEqual([1]);
  });

  it("works with custom settings", () => {
    const settings = createSettings({
      require: ["1080p"],
      exclude: ["CAM"],
      preferred: ["BluRay"],
      resolutions: {
        r2160p: true,
      },
      customRanks: {
        quality: {
          remux: {
            fetch: true,
          },
        },
      },
    });

    // This should match require and get preferred bonus
    const result = rankTorrent(
      "Movie.2024.1080p.BluRay.REMUX.AVC-GROUP",
      "1234567890123456789012345678901234567893",
      "Breaking Bad",
      settings,
    );

    expect(result.fetch).toBe(true);
    expect(result.rank).toBeGreaterThan(10000); // preferred bonus
  });

  it("rejects excluded content", () => {
    const settings = createSettings({
      exclude: ["CAM"],
    });
    const result = rankTorrent(
      "Movie.2024.CAM-GROUP",
      "1234567890123456789012345678901234567893",
      "Breaking Bad",
      settings,
    );

    // CAM is both trash and excluded
    expect(result.fetch).toBe(false);
  });
});

describe("public API exports", () => {
  it("exports all expected functions", () => {
    expect(typeof parse).toBe("function");
    expect(typeof rank).toBe("function");
    expect(typeof checkFetch).toBe("function");
    expect(typeof rankTorrent).toBe("function");
    expect(typeof createSettings).toBe("function");
  });
});
