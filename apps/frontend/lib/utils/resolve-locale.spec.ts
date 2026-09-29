import { describe, expect, it } from "vitest";

import { defaultLocale, resolveLocale } from "./resolve-locale";

describe("fallback to the default locale", () => {
  it.for([
    ["a null header", null],
    ["an empty header", ""],
    ["a wildcard", "*"],
    ["only invalid tags", "not a tag!!, 123"],
    ["only zero-weighted tags", "fr;q=0, de;q=0"],
  ] as const)(`returns ${defaultLocale} for %s`, ([, acceptLanguage]) => {
    expect(resolveLocale(acceptLanguage)).toBe(defaultLocale);
  });
});

describe("tag preference", () => {
  it.for([
    ["en-GB,en;q=0.9", "en-GB"],
    ["fr;q=0.8, de-AT", "de-AT"],
    ["fr;q=0.5, de;q=0.9, ja;q=0.7", "de-DE"],
    ["en;q=0, fr;q=0.5", "fr-FR"],
    ["*, fr;q=0.5", "fr-FR"],
  ] as const)('resolves "%s" to %s', ([acceptLanguage, expected]) => {
    expect(resolveLocale(acceptLanguage)).toBe(expected);
  });

  it("keeps header order for tags with equal weights", () => {
    expect(resolveLocale("it;q=0.5, es;q=0.5")).toBe("it-IT");
  });

  it("treats an unparseable weight as zero", () => {
    expect(resolveLocale("fr;q=abc, de;q=0.1")).toBe("de-DE");
  });

  it("skips invalid tags", () => {
    expect(resolveLocale("not a tag!!, ja")).toBe("ja-JP");
  });
});

describe("normalisation", () => {
  it.for([
    ["en-us", "en-US"],
    ["EN-gb", "en-GB"],
    [" en-GB ; q=0.9 ", "en-GB"],
    ["zh-Hant-TW", "zh-TW"],
  ] as const)('normalises "%s" to %s', ([acceptLanguage, expected]) => {
    expect(resolveLocale(acceptLanguage)).toBe(expected);
  });
});

describe("region inference", () => {
  it.for([
    ["en", "en-US"],
    ["de", "de-DE"],
    ["ja", "ja-JP"],
    ["pt", "pt-BR"],
    ["zh", "zh-CN"],
    ["sr-Latn", "sr-RS"],
  ] as const)('infers "%s" as %s', ([acceptLanguage, expected]) => {
    expect(resolveLocale(acceptLanguage)).toBe(expected);
  });

  it("replaces a numeric UN M.49 region with the most likely ISO 3166-1 region", () => {
    expect(resolveLocale("es-419")).toBe("es-ES");
  });
});
