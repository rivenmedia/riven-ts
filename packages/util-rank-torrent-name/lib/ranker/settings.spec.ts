import { describe, expect, it } from "vitest";

import { createSettings } from "./ranking-settings.schema.ts";

describe("createSettings", () => {
  it("creates default settings from empty input", () => {
    const settings = createSettings();

    expect(settings.require).toEqual([]);
    expect(settings.exclude).toEqual([]);
    expect(settings.preferred).toEqual([]);
    expect(settings.compiledRequire).toEqual([]);
    expect(settings.compiledExclude).toEqual([]);
    expect(settings.compiledPreferred).toEqual([]);
  });

  it("creates settings from partial input", () => {
    const settings = createSettings({
      require: ["1080p"],
      resolutions: { r2160p: true },
    });

    expect(settings.require).toEqual(["1080p"]);
    expect(settings.compiledRequire).toHaveLength(1);
    expect(settings.resolutions.r2160p).toBe(true);

    // Other resolutions should have defaults
    expect(settings.resolutions.r1080p).toBe(true);
    expect(settings.resolutions.r720p).toBe(true);
  });

  it("compiles case-insensitive patterns by default", () => {
    const settings = createSettings({ require: ["BluRay"] });

    expect(settings.compiledRequire[0]?.test("bluray")).toBe(true);
    expect(settings.compiledRequire[0]?.test("BLURAY")).toBe(true);
  });

  it("compiles case-sensitive patterns with slashes", () => {
    const settings = createSettings({ require: ["/BluRay/"] });

    expect(settings.compiledRequire[0]?.test("BluRay")).toBe(true);
    expect(settings.compiledRequire[0]?.test("bluray")).toBe(false);
  });

  it("has correct default options", () => {
    const settings = createSettings();

    expect(settings.options.removeAllTrash).toBe(true);
    expect(settings.options.removeRanksUnder).toBe(-10000);
    expect(settings.options.removeUnknownLanguages).toBe(false);
    expect(settings.options.allowEnglishInLanguages).toBe(true);
    expect(settings.options.removeAdultContent).toBe(true);
  });

  it("has correct default resolution config", () => {
    const settings = createSettings();

    expect(settings.resolutions.r2160p).toBe(false);
    expect(settings.resolutions.r1080p).toBe(true);
    expect(settings.resolutions.r720p).toBe(true);
    expect(settings.resolutions.r480p).toBe(false);
    expect(settings.resolutions.r360p).toBe(false);
    expect(settings.resolutions.unknown).toBe(true);
  });

  it("has correct default custom ranks", () => {
    const settings = createSettings();

    // Quality
    expect(settings.customRanks.quality.bluray.fetch).toBe(true);
    expect(settings.customRanks.quality.remux.fetch).toBe(false);
    expect(settings.customRanks.quality.av1.fetch).toBe(false);
    expect(settings.customRanks.quality.web.fetch).toBe(true);

    // Rips
    expect(settings.customRanks.rips.webrip.fetch).toBe(true);
    expect(settings.customRanks.rips.dvdrip.fetch).toBe(false);

    // HDR
    expect(settings.customRanks.hdr.dolbyVision.fetch).toBe(false);
    expect(settings.customRanks.hdr.hdr.fetch).toBe(true);

    // Audio
    expect(settings.customRanks.audio.atmos.fetch).toBe(true);
    expect(settings.customRanks.audio.mp3.fetch).toBe(false);

    // Extras
    expect(settings.customRanks.extras.threeD.fetch).toBe(false);
    expect(settings.customRanks.extras.proper.fetch).toBe(true);

    // Trash
    expect(settings.customRanks.trash.cam.fetch).toBe(false);
    expect(settings.customRanks.trash.telesync.fetch).toBe(false);
  });

  it("allows custom rank overrides", () => {
    const settings = createSettings({
      customRanks: {
        quality: { remux: { fetch: true, rank: 5000 } },
      },
    });

    expect(settings.customRanks.quality.remux.fetch).toBe(true);
    expect(settings.customRanks.quality.remux.rank).toBe(5000);

    // Other quality ranks should still have defaults
    expect(settings.customRanks.quality.bluray.fetch).toBe(true);
  });

  it("throws on invalid input types", () => {
    // @ts-expect-error - invalid type for resolutions
    expect(() => createSettings({ resolutions: { r1080p: "yes" } })).toThrow();
  });

  it("accepts empty language config", () => {
    const settings = createSettings();

    expect(settings.languages.required).toEqual([]);
    expect(settings.languages.allowed).toEqual([]);
    expect(settings.languages.exclude).toEqual([]);
    expect(settings.languages.preferred).toEqual([]);
  });
});
