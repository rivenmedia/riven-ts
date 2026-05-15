import { describe, expect, it } from "vitest";

import { parseTorrentioStreamStats } from "../parse-torrentio-stream-stats.ts";

describe("parseTorrentioStreamStats", () => {
  it("extracts size and seeders from a fully-populated stats line", () => {
    const title =
      "The.Matrix.1999.1080p.BluRay.x264-RELEASE\n👤 42 💾 8.5 GB ⚙️ ThePirateBay";

    expect(parseTorrentioStreamStats(title)).toEqual({
      seeders: 42,
      size: Math.round(8.5 * 1024 ** 3),
    });
  });

  it("handles MB-sized payloads", () => {
    const title = "Some.Movie.2019\n👤 7 💾 750 MB";

    expect(parseTorrentioStreamStats(title)).toEqual({
      seeders: 7,
      size: 750 * 1024 ** 2,
    });
  });

  it("returns nulls when the stats line is absent", () => {
    expect(parseTorrentioStreamStats("Just.A.Title")).toEqual({
      seeders: null,
      size: null,
    });
  });

  it("returns null for seeders when the seeder token has no number", () => {
    const title = "Movie\n👤  💾 1 GB";

    expect(parseTorrentioStreamStats(title)).toEqual({
      seeders: null,
      size: 1 * 1024 ** 3,
    });
  });

  it("returns null for size when the size token is malformed", () => {
    const title = "Movie\n👤 3 💾 huge";

    expect(parseTorrentioStreamStats(title)).toEqual({
      seeders: 3,
      size: null,
    });
  });

  it("ignores stats markers on the first line (false positives)", () => {
    // The stats line is anchored to a `\n👤` boundary, so emoji in the title
    // itself must not be misread.
    const title = "👤 Movie.With.Emoji.In.Name";

    expect(parseTorrentioStreamStats(title)).toEqual({
      seeders: null,
      size: null,
    });
  });
});
