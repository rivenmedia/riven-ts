import { describe, expect, it } from "vitest";

import { createSettings } from "./ranking-settings.schema.ts";

describe("createSettings", () => {
  it("creates default settings from empty input", () => {
    const settings = createSettings();

    expect(settings.require).toStrictEqual([]);
    expect(settings.exclude).toStrictEqual([]);
    expect(settings.preferred).toStrictEqual([]);
    expect(settings.compiledRequire).toStrictEqual([]);
    expect(settings.compiledExclude).toStrictEqual([]);
    expect(settings.compiledPreferred).toStrictEqual([]);
  });

  it("creates settings from partial input", () => {
    const settings = createSettings({
      require: ["1080p"],
      resolutions: { r2160p: true },
    });

    expect(settings.require).toStrictEqual(["1080p"]);
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
    expect(settings.options.removeRanksUnder).toBe(-10_000);
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

  it("throws on invalid input types", () => {
    // @ts-expect-error - invalid type for resolutions
    expect(() => createSettings({ resolutions: { r1080p: "yes" } })).toThrow();
  });

  it("accepts empty language config", () => {
    const settings = createSettings();

    expect(settings.languages.required).toStrictEqual([]);
    expect(settings.languages.allowed).toStrictEqual([]);
    expect(settings.languages.exclude).toStrictEqual([]);
    expect(settings.languages.preferred).toStrictEqual([]);
  });
});
