import { describe, expect, it } from "vitest";

import { parseFilePath } from "./parse.ts";

describe("parseFilePath", () => {
  it("should throw on empty file path", () => {
    expect(() => parseFilePath("")).toThrow(TypeError);
  });

  it("should parse a simple single-segment file path", () => {
    const data = parseFilePath("Movie.2024.1080p.BluRay.x264-GROUP.mkv");

    expect(data.title).toBe("Movie");
    expect(data.year).toBe(2024);
    expect(data.resolution).toBe("1080p");
  });

  it("should parse a multi-segment file path with season/episode info", () => {
    const data = parseFilePath("Show.Name.S01E05.720p.HDTV/episode.mkv");

    expect(data.seasons).toContain(1);
    expect(data.episodes).toContain(5);
  });

  it("should merge parsed data across path segments", () => {
    const data = parseFilePath("Season 02/Some.Episode.720p.HDTV.mkv");

    expect(data.seasons).toContain(2);
    expect(data.resolution).toBe("720p");
  });

  it("should handle leading slashes", () => {
    const data = parseFilePath("/Season 02/S02E01.mkv");

    expect(data.seasons).toContain(2);
  });

  it("should throw on segments that cannot be parsed at all", () => {
    expect(() => parseFilePath("///")).toThrow(TypeError);
  });
});
