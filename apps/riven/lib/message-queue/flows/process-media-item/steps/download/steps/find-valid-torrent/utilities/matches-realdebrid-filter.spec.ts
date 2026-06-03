import { describe, expect, it } from "vitest";

import { matchesRealdebridFilter } from "./matches-realdebrid-filter.ts";

const RD_BLOCKLIST = [
  "web-dl",
  "webrip",
  "bdrip",
  "hdrip",
  "dvdrip",
  "bluray.x264",
  "hdtv.x264",
  "hdtv.xvid",
  "web.x264",
  "web.h264",
] as const;

describe("matchesRealdebridFilter", () => {
  it("matches Type 1 bare substrings", () => {
    expect(
      matchesRealdebridFilter("Movie.2018.1080p.WEB-DL.DDP5.1-GRP", RD_BLOCKLIST),
    ).toBe(true);
    expect(
      matchesRealdebridFilter("Movie.2018.720p.WEBRip.x265-GRP", RD_BLOCKLIST),
    ).toBe(true);
    expect(
      matchesRealdebridFilter("Movie.1998.DVDRip.XviD-GRP", RD_BLOCKLIST),
    ).toBe(true);
  });

  it("matches Type 2 adjacent dot-separated source.codec pairs", () => {
    expect(
      matchesRealdebridFilter("Movie.2010.1080p.BluRay.x264-GRP", RD_BLOCKLIST),
    ).toBe(true);
    expect(
      matchesRealdebridFilter("Show.S01E01.HDTV.XviD-GRP", RD_BLOCKLIST),
    ).toBe(true);
    expect(
      matchesRealdebridFilter("Show.S01E01.WEB.h264-GRP", RD_BLOCKLIST),
    ).toBe(true);
  });

  it("is case-insensitive", () => {
    expect(
      matchesRealdebridFilter("MOVIE.2010.1080P.BLURAY.X264-GRP", RD_BLOCKLIST),
    ).toBe(true);
  });

  it("requires the dot for Type 2 (the . enforces adjacency)", () => {
    // "webx264" (no dot) must NOT match the "web.x264" pattern
    expect(matchesRealdebridFilter("Movie.2010.WEBx264-GRP", RD_BLOCKLIST)).toBe(
      false,
    );
  });

  it("passes clean releases that RD does not filter", () => {
    expect(
      matchesRealdebridFilter(
        "Movie.2010.2160p.BluRay.REMUX.HEVC.TrueHD.7.1-GRP",
        RD_BLOCKLIST,
      ),
    ).toBe(false);
    expect(
      matchesRealdebridFilter("Movie.2010.1080p.BluRay.x265-GRP", RD_BLOCKLIST),
    ).toBe(false);
  });

  it("matches nothing when the blocklist is empty", () => {
    expect(matchesRealdebridFilter("Movie.2018.1080p.WEB-DL-GRP", [])).toBe(
      false,
    );
  });
});
