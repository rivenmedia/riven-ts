import { ParsedDataSchema } from "@repo/util-rank-torrent-name";

import { describe, expect } from "vitest";

import { it } from "../../../../../../../../__tests__/test-context.ts";
import { shouldSkipTorrent } from "./should-skip-torrent.ts";

function createParsedData(
  overrides: Partial<{ resolution: string; languages: string[] }> = {},
) {
  return ParsedDataSchema.parse({
    rawTitle: "Example Title 1080p en",
    title: "Example Title",
    resolution: "1080p",
    languages: ["en"],
    ...overrides,
  });
}

describe("the torrent preference filter", () => {
  it("returns null when there are no preferences", () => {
    expect(shouldSkipTorrent(createParsedData(), null)).toBeNull();
    expect(shouldSkipTorrent(createParsedData(), undefined)).toBeNull();
  });

  it("returns null when the torrent matches all preferences", () => {
    expect(
      shouldSkipTorrent(createParsedData(), {
        resolutions: ["1080p", "2160p"],
        language: "en",
      }),
    ).toBeNull();
  });

  it("returns a reason when the resolution is not allowed", () => {
    expect(
      shouldSkipTorrent(createParsedData({ resolution: "720p" }), {
        resolutions: ["1080p"],
      }),
    ).toBe("resolution 720p is not one of the allowed resolutions (1080p)");
  });

  it("returns a reason when the language is missing", () => {
    expect(
      shouldSkipTorrent(createParsedData({ languages: ["ja"] }), {
        language: "en",
      }),
    ).toBe("language is not en");
  });

  it("matches the language case-insensitively", () => {
    expect(
      shouldSkipTorrent(createParsedData({ languages: ["EN"] }), {
        language: "en",
      }),
    ).toBeNull();
  });

  it("returns null for a torrent of an unknown resolution when no resolution preference is set", () => {
    expect(
      shouldSkipTorrent(createParsedData({ resolution: "unknown" }), {
        language: "en",
      }),
    ).toBeNull();
  });
});
