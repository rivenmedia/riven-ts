/**
 * Tests for the RTN TypeScript implementation
 */
import { describe, expect, it } from "vitest";

import {
  GarbageTorrent,
  RTN,
  Resolution,
  SettingsDisabled,
  checkFetch,
  createDefaultRanking,
  createDefaultSettings,
  extractEpisodes,
  extractSeasons,
  getLevRatio,
  getRank,
  normalizeTitle,
  parse,
  sortTorrents,
  titleMatch,
} from "./index.ts";

describe("parse", () => {
  it("should parse a movie title correctly", () => {
    const data = parse("Inception.2010.1080p.BluRay.x264-GROUP");

    expect(data.parsedTitle).toBe("Inception");
    expect(data.year).toBe(2010);
    expect(data.resolution).toBe("1080p");
    expect(data.quality).toBe("BluRay");
  });

  it("should parse a TV show title correctly", () => {
    const data = parse("Game.of.Thrones.S01E01.720p.HDTV.x264-CTU");

    expect(data.parsedTitle).toBe("Game of Thrones");
    expect(data.seasons).toContain(1);
    expect(data.episodes).toContain(1);
    expect(data.resolution).toBe("720p");
  });

  it("should handle 4K HDR titles", () => {
    const data = parse(
      "Inception (2010) (2160p HDR BDRip x265 10bit DTS-HD MA 5.1 - r0b0t) [TAoE].mkv",
    );

    expect(data.parsedTitle).toBeTruthy();
    expect(data.resolution).toBe("2160p");
  });

  it("should throw for empty title", () => {
    expect(() => parse("")).toThrow(TypeError);
  });
});

describe("RTN", () => {
  it("should create an instance with default settings", () => {
    const rtn = new RTN();
    expect(rtn.getSettings()).toBeDefined();
    expect(rtn.getRankingModel()).toBeDefined();
  });

  it("should rank a torrent", () => {
    const rtn = new RTN();
    const torrent = rtn.rank(
      "Inception.2010.1080p.BluRay.x264-GROUP",
      "c08a9ee8ce3a5c2c08865e2b05406273cabc97e7",
    );

    expect(torrent.infohash).toBe("c08a9ee8ce3a5c2c08865e2b05406273cabc97e7");
    expect(torrent.rawTitle).toBe("Inception.2010.1080p.BluRay.x264-GROUP");
    expect(torrent.data).toBeDefined();
    expect(typeof torrent.rank).toBe("number");
  });

  it("should throw for invalid infohash length", () => {
    const rtn = new RTN();
    expect(() => rtn.rank("Test Title", "invalid")).toThrow(GarbageTorrent);
  });

  it("should throw when settings are disabled", () => {
    const settings = createDefaultSettings();
    settings.enabled = false;
    const rtn = new RTN(settings);

    expect(() =>
      rtn.rank("Test.Title.1080p", "c08a9ee8ce3a5c2c08865e2b05406273cabc97e7"),
    ).toThrow(SettingsDisabled);
  });

  it("should throw garbage torrent when title doesn't match", () => {
    const rtn = new RTN();

    expect(() =>
      rtn.rank(
        "Completely.Different.Movie.2024.1080p",
        "c08a9ee8ce3a5c2c08865e2b05406273cabc97e7",
        "Inception",
        true,
      ),
    ).toThrow(GarbageTorrent);
  });
});

describe("getRank", () => {
  it("should calculate rank for quality", () => {
    const settings = createDefaultSettings();
    const ranking = createDefaultRanking();
    const data = parse("Movie.2024.1080p.BluRay.x264-GROUP");

    const rank = getRank(data, settings, ranking);
    expect(rank).toBeGreaterThan(0);
  });

  it("should give high rank to REMUX", () => {
    const settings = createDefaultSettings();
    const ranking = createDefaultRanking();

    const remuxData = parse("Movie.2024.1080p.REMUX.x264-GROUP");
    const blurayData = parse("Movie.2024.1080p.BluRay.x264-GROUP");

    // Manually set quality since parse might not detect it
    remuxData.quality = "REMUX";

    const remuxRank = getRank(remuxData, settings, ranking);
    const blurayRank = getRank(blurayData, settings, ranking);

    expect(remuxRank).toBeGreaterThan(blurayRank);
  });
});

describe("checkFetch", () => {
  it("should allow fetchable torrents", () => {
    const settings = createDefaultSettings();
    const data = parse("Movie.2024.1080p.BluRay.x264-GROUP");

    const result = checkFetch(data, settings);
    expect(result.fetch).toBe(true);
    expect(result.failedKeys).toHaveLength(0);
  });

  it("should reject trash quality when removeAllTrash is true", () => {
    const settings = createDefaultSettings();
    settings.options.removeAllTrash = true;

    const data = parse("Movie.2024.CAM.x264-GROUP");
    data.quality = "CAM"; // Manually set since parse might not detect

    const result = checkFetch(data, settings);
    expect(result.fetch).toBe(false);
    expect(result.failedKeys).toContain("trash_quality");
  });

  it("should reject disabled resolutions", () => {
    const settings = createDefaultSettings();
    settings.resolutions.r2160p = false;

    const data = parse("Movie.2024.2160p.BluRay.x264-GROUP");

    const result = checkFetch(data, settings);
    expect(result.fetch).toBe(false);
  });
});

describe("normalizeTitle", () => {
  it("should normalize titles correctly", () => {
    expect(normalizeTitle("The Movie")).toBe("the movie");
    expect(normalizeTitle("Mr. Robot")).toBe("mr robot");
    expect(normalizeTitle("Café Society")).toBe("cafe society");
  });

  it("should handle special characters", () => {
    expect(normalizeTitle("Movie & Film")).toBe("movie and film");
    expect(normalizeTitle("Movie_Title")).toBe("movie title");
  });
});

describe("Levenshtein functions", () => {
  it("should match similar titles", () => {
    expect(titleMatch("Inception", "inception", 0.85)).toBe(true);
    expect(titleMatch("The Matrix", "The Matrix", 0.85)).toBe(true);
  });

  it("should not match different titles", () => {
    expect(titleMatch("Inception", "Avatar", 0.85)).toBe(false);
    expect(titleMatch("The Matrix", "matrix the", 0.9)).toBe(false);
  });

  it("should calculate ratio correctly", () => {
    const ratio = getLevRatio("Inception", "inception");
    expect(ratio).toBeGreaterThan(0.9);
  });

  it("should throw for empty titles", () => {
    expect(() => getLevRatio("", "test")).toThrow();
    expect(() => getLevRatio("test", "")).toThrow();
  });
});

describe("sortTorrents", () => {
  it("should sort by resolution and rank", () => {
    const settings = createDefaultSettings();
    settings.resolutions.r2160p = true;
    const rtn = new RTN(settings);

    const t1 = rtn.rank("Movie.2024.1080p.BluRay.x264-A", "a".repeat(40));
    const t2 = rtn.rank("Movie.2024.2160p.BluRay.x264-B", "b".repeat(40));

    const sorted = sortTorrents(new Set([t1, t2]));
    const keys = Array.from(sorted.keys());

    // 2160p should come first
    expect(keys[0]).toBe("b".repeat(40));
  });

  it("should apply bucket limits", () => {
    const rtn = new RTN();
    const torrents = new Set([
      rtn.rank("Movie.2024.1080p.BluRay.x264-A", "a".repeat(40)),
      rtn.rank("Movie.2024.1080p.WEB-DL.x264-B", "b".repeat(40)),
      rtn.rank("Movie.2024.1080p.HDTV.x264-C", "c".repeat(40)),
    ]);

    const sorted = sortTorrents(torrents, 2);
    expect(sorted.size).toBeLessThanOrEqual(2);
  });
});

describe("extractSeasons and extractEpisodes", () => {
  it("should extract season numbers", () => {
    const seasons = extractSeasons("Show.S03E05.720p.HDTV");
    expect(seasons).toContain(3);
  });

  it("should extract episode numbers", () => {
    const episodes = extractEpisodes("Show.S03E05.720p.HDTV");
    expect(episodes).toContain(5);
  });

  it("should throw for empty input", () => {
    expect(() => extractSeasons("")).toThrow(TypeError);
    expect(() => extractEpisodes("")).toThrow(TypeError);
  });
});
