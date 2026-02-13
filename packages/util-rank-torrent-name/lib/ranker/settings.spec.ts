import { describe, expect, it } from "vitest";

import { DEFAULT_RANKING, createSettings } from "./settings.ts";

describe("createSettings", () => {
  it("creates default settings from empty input", () => {
    const s = createSettings();

    expect(s.require).toEqual([]);
    expect(s.exclude).toEqual([]);
    expect(s.preferred).toEqual([]);
    expect(s.compiledRequire).toEqual([]);
    expect(s.compiledExclude).toEqual([]);
    expect(s.compiledPreferred).toEqual([]);
  });

  it("creates settings from partial input", () => {
    const s = createSettings({
      require: ["1080p"],
      resolutions: { r2160p: true },
    });

    expect(s.require).toEqual(["1080p"]);
    expect(s.compiledRequire).toHaveLength(1);
    expect(s.resolutions.r2160p).toBe(true);

    // Other resolutions should have defaults
    expect(s.resolutions.r1080p).toBe(true);
    expect(s.resolutions.r720p).toBe(true);
  });

  it("compiles case-insensitive patterns by default", () => {
    const s = createSettings({ require: ["BluRay"] });

    expect(s.compiledRequire[0]?.test("bluray")).toBe(true);
    expect(s.compiledRequire[0]?.test("BLURAY")).toBe(true);
  });

  it("compiles case-sensitive patterns with slashes", () => {
    const s = createSettings({ require: ["/BluRay/"] });

    expect(s.compiledRequire[0]?.test("BluRay")).toBe(true);
    expect(s.compiledRequire[0]?.test("bluray")).toBe(false);
  });

  it("has correct default options", () => {
    const s = createSettings();

    expect(s.options.removeAllTrash).toBe(true);
    expect(s.options.removeRanksUnder).toBe(-10000);
    expect(s.options.removeUnknownLanguages).toBe(false);
    expect(s.options.allowEnglishInLanguages).toBe(true);
    expect(s.options.removeAdultContent).toBe(true);
  });

  it("hasq correct default resolution config", () => {
    const s = createSettings();

    expect(s.resolutions.r2160p).toBe(false);
    expect(s.resolutions.r1080p).toBe(true);
    expect(s.resolutions.r720p).toBe(true);
    expect(s.resolutions.r480p).toBe(false);
    expect(s.resolutions.r360p).toBe(false);
    expect(s.resolutions.unknown).toBe(true);
  });

  it("has correct default custom ranks", () => {
    const s = createSettings();

    // Quality
    expect(s.customRanks.quality.bluray.fetch).toBe(true);
    expect(s.customRanks.quality.remux.fetch).toBe(false);
    expect(s.customRanks.quality.av1.fetch).toBe(false);
    expect(s.customRanks.quality.web.fetch).toBe(true);

    // Rips
    expect(s.customRanks.rips.webrip.fetch).toBe(true);
    expect(s.customRanks.rips.dvdrip.fetch).toBe(false);

    // HDR
    expect(s.customRanks.hdr.dolbyVision.fetch).toBe(false);
    expect(s.customRanks.hdr.hdr.fetch).toBe(true);

    // Audio
    expect(s.customRanks.audio.atmos.fetch).toBe(true);
    expect(s.customRanks.audio.mp3.fetch).toBe(false);

    // Extras
    expect(s.customRanks.extras.threeD.fetch).toBe(false);
    expect(s.customRanks.extras.proper.fetch).toBe(true);

    // Trash
    expect(s.customRanks.trash.cam.fetch).toBe(false);
    expect(s.customRanks.trash.telesync.fetch).toBe(false);
  });

  it("allows custom rank overrides", () => {
    const s = createSettings({
      customRanks: {
        quality: { remux: { fetch: true, rank: 5000 } },
      },
    });

    expect(s.customRanks.quality.remux.fetch).toBe(true);
    expect(s.customRanks.quality.remux.rank).toBe(5000);

    // Other quality ranks should still have defaults
    expect(s.customRanks.quality.bluray.fetch).toBe(true);
  });

  it("throws on invalid input types", () => {
    // @ts-expect-error - invalid type for resolutions
    expect(() => createSettings({ resolutions: { r1080p: "yes" } })).toThrow();
  });

  it("accepts empty language config", () => {
    const s = createSettings();

    expect(s.languages.required).toEqual([]);
    expect(s.languages.allowed).toEqual([]);
    expect(s.languages.exclude).toEqual([]);
    expect(s.languages.preferred).toEqual([]);
  });
});

describe("DEFAULT_RANKING", () => {
  it("has expected quality values", () => {
    expect(DEFAULT_RANKING.remux).toBe(10000);
    expect(DEFAULT_RANKING.bluray).toBe(100);
    expect(DEFAULT_RANKING.webdl).toBe(200);
    expect(DEFAULT_RANKING.cam).toBe(-10000);
  });

  it("has expected HDR values", () => {
    expect(DEFAULT_RANKING.dolbyVision).toBe(3000);
    expect(DEFAULT_RANKING.hdr).toBe(2000);
    expect(DEFAULT_RANKING.hdr10plus).toBe(2100);
  });

  it("has expected audio values", () => {
    expect(DEFAULT_RANKING.truehd).toBe(2000);
    expect(DEFAULT_RANKING.atmos).toBe(1000);
    expect(DEFAULT_RANKING.mp3).toBe(-1000);
  });
});
