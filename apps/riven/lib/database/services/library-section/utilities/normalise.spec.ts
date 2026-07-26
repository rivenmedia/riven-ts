import { describe, expect, it } from "vitest";

import {
  normaliseCountry,
  normaliseLanguage,
  normaliseResolution,
  normaliseText,
  normaliseTextList,
} from "./normalise.ts";

describe(normaliseText, () => {
  it.each([
    ["Science Fiction", "science fiction"],
    ["  Horror  ", "horror"],
    ["", null],
    ["   ", null],
    [null, null],
    [undefined, null],
  ])("maps %o to %o", (input, expected) => {
    expect(normaliseText(input)).toBe(expected);
  });
});

describe(normaliseTextList, () => {
  it("lowercases, trims and de-duplicates", () => {
    expect(normaliseTextList(["Horror", " horror ", "Thriller"])).toStrictEqual(
      ["horror", "thriller"],
    );
  });

  it("drops empty entries", () => {
    expect(normaliseTextList(["Horror", "", "  "])).toStrictEqual(["horror"]);
  });

  it.each([[null], [undefined]])("maps %o to an empty list", (input) => {
    expect(normaliseTextList(input)).toStrictEqual([]);
  });
});

describe(normaliseLanguage, () => {
  it("folds the ISO 639-3 codes shows are indexed with", () => {
    expect(normaliseLanguage("eng")).toBe("en");
    expect(normaliseLanguage("jpn")).toBe("ja");
  });

  it("leaves the ISO 639-1 codes movies are indexed with alone", () => {
    expect(normaliseLanguage("en")).toBe("en");
    expect(normaliseLanguage("JA")).toBe("ja");
  });

  it("makes a movie and a show in the same language match one rule", () => {
    expect(normaliseLanguage("en")).toBe(normaliseLanguage("eng"));
  });

  it("passes unmapped values through lowercased", () => {
    expect(normaliseLanguage("xyz")).toBe("xyz");
  });
});

describe(normaliseCountry, () => {
  it("folds the alpha-3 slugs shows are indexed with", () => {
    expect(normaliseCountry("usa")).toBe("us");
    expect(normaliseCountry("gbr")).toBe("gb");
  });

  it("leaves the alpha-2 codes movies are indexed with alone", () => {
    expect(normaliseCountry("US")).toBe("us");
  });

  it("makes a movie and a show from the same country match one rule", () => {
    expect(normaliseCountry("US")).toBe(normaliseCountry("usa"));
  });
});

describe(normaliseResolution, () => {
  it.each([
    ["4k", "2160p"],
    ["2160p", "2160p"],
    ["1440p", "1080p"],
    ["1080p", "1080p"],
    ["576p", "480p"],
  ])("folds the release spelling %o onto %o", (input, expected) => {
    expect(normaliseResolution(input)).toBe(expected);
  });

  it("agrees however a release spelled the same resolution", () => {
    // Observed live: Comet returned a 2160p remux whose parsed resolution was
    // "4k", so a rule written against "2160p" has to match it.
    expect(normaliseResolution("4k")).toBe(normaliseResolution("2160p"));
  });

  it("passes an unmapped value through lowercased", () => {
    expect(normaliseResolution("8K")).toBe("8k");
  });
});
