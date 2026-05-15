import { describe, expect, it } from "vitest";

import { parseCometStreamStats } from "../parse-comet-stream-stats.ts";

describe("parseCometStreamStats", () => {
  it("extracts size and seeders from a typical Comet description", () => {
    const description = "💾 8.5 GB 👤 42 🌐 ThePirateBay";

    expect(parseCometStreamStats(description)).toEqual({
      seeders: 42,
      size: Math.round(8.5 * 1024 ** 3),
    });
  });

  it("handles MB-sized payloads", () => {
    const description = "💾 750 MB 👤 7";

    expect(parseCometStreamStats(description)).toEqual({
      seeders: 7,
      size: 750 * 1024 ** 2,
    });
  });

  it("returns nulls when no stats are present", () => {
    expect(parseCometStreamStats("just some text")).toEqual({
      seeders: null,
      size: null,
    });
  });

  it("returns null for size when the size token is malformed", () => {
    const description = "💾 unknown 👤 3";

    expect(parseCometStreamStats(description)).toEqual({
      seeders: 3,
      size: null,
    });
  });

  it("returns null for seeders when no number follows the marker", () => {
    const description = "💾 1 GB 👤 done";

    expect(parseCometStreamStats(description)).toEqual({
      seeders: null,
      size: 1 * 1024 ** 3,
    });
  });

  it("captures only the first occurrence of each marker", () => {
    // Defensive: Comet has historically duplicated tokens for multi-file
    // payloads; we should take the first.
    const description = "💾 4 GB 👤 12 💾 2 GB 👤 0";

    expect(parseCometStreamStats(description)).toEqual({
      seeders: 12,
      size: 4 * 1024 ** 3,
    });
  });
});
