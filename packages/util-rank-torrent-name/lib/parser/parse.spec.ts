import { describe, expect, it } from "vitest";

import { parse } from "./parse.ts";

describe("parse", () => {
  it("should throw on empty input", () => {
    expect(() => parse("")).toThrow(TypeError);
  });

  it("should parse a basic movie title", () => {
    const data = parse("The Matrix 1999 1080p BluRay x264-GROUP");

    expect(data.title).toBe("The Matrix");
    expect(data.year).toBe(1999);
    expect(data.resolution).toBe("1080p");
    expect(data.quality).toBe("BluRay");
    expect(data.type).toBe("movie");
    expect(data.rawTitle).toBe("The Matrix 1999 1080p BluRay x264-GROUP");
    expect(data.normalisedTitle).toBe("the matrix");
  });

  it("should parse a TV show with season and episode", () => {
    const data = parse("The Walking Dead S05E03 720p HDTV x264-ASAP[ettv]");
    expect(data.title).toBe("The Walking Dead");
    expect(data.seasons).toEqual([5]);
    expect(data.episodes).toEqual([3]);
    expect(data.resolution).toBe("720p");
    expect(data.type).toBe("show");
  });

  it("should parse HDR content", () => {
    const data = parse(
      "Movie.2023.2160p.UHD.BluRay.REMUX.HDR.DV.HEVC.DTS-HD.MA.5.1-GROUP",
    );

    // ptt-viren may return "4k" or "2160p" for UHD content
    expect(["2160p", "4k"]).toContain(data.resolution);
    expect(data.hdr?.length).toBeGreaterThan(0);
  });

  it("should detect WEB-DL quality", () => {
    const data = parse("Movie.2024.1080p.WEB-DL.DD5.1.H264-GROUP");
    expect(data.quality).toBe("WEB-DL");
  });

  it("should parse audio formats", () => {
    const data = parse("Movie.2024.1080p.BluRay.DTS-HD.MA.5.1-GROUP");

    // DTS-HD MA is parsed as DTS Lossless by ptt-viren
    expect(data.audio?.length).toBeGreaterThan(0);
  });

  it("should set default resolution to unknown", () => {
    const data = parse("Movie 2024-GROUP");
    expect(data.resolution).toBe("unknown");
  });

  it("should detect REMUX", () => {
    const data = parse("Movie.2023.1080p.BluRay.REMUX.AVC.DTS-HD.MA.5.1-GROUP");
    expect(data.remux).toBe(true);
  });

  it("should handle dubbed content", () => {
    const data = parse("Movie.2024.DUBBED.720p.WEB-DL-GROUP");
    expect(data.dubbed).toBe(true);
  });

  it("should detect proper/repack", () => {
    const data = parse("Movie.2024.720p.BluRay.PROPER-GROUP");
    expect(data.proper).toBe(true);
  });

  it("should handle converted content", () => {
    const data = parse("Movie.2024.CONVERT.720p.WEB-DL-GROUP");
    expect(data.converted).toBe(true);
  });

  it("should parse anime episodes", () => {
    const data = parse("One Piece 1080 1080p WEB-DL");
    expect(data.episodes).toContain(1080);
  });

  it("should throw on non-string input", () => {
    expect(() => parse(null as unknown as string)).toThrow(TypeError);
  });

  it("should parse complete series packs", () => {
    const data = parse(
      "Breaking Bad The Complete Series 1080p BluRay x264-GROUP",
    );
    expect(data.complete).toBe(true);
  });

  it("should parse 2.0 channels", () => {
    const data = parse("Movie.2024.1080p.BluRay.2.0.x264-GROUP");
    expect(data.channels).toContain("2.0");
  });

  it("should detect known site names", () => {
    const data = parse("Movie.2024.1080p.BluRay.x264-GROUP-RARBG");
    expect(data.site).toBe("RARBG");
  });

  it("should parse bitrate", () => {
    const data = parse("Movie.2024.1080p.BluRay.10mbps-GROUP");
    expect(data.bitrate).toBe("10mbps");
  });

  it("should parse anime episode numbers for known anime titles", () => {
    const data = parse("One Piece 1080 1080p WEB-DL");
    expect(data.episodes).toContain(1080);
  });

  it("should skip anime episode parsing if episodes already detected", () => {
    const data = parse("One Piece S01E15 1080p WEB-DL");
    expect(data.episodes).toContain(15);
  });
});
