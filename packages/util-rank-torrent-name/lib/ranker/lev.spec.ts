import { describe, expect, it } from "vitest";

import { getLevRatio, titleMatch } from "./lev.ts";
import { parse } from "./parse.ts";

describe("titleMatch", () => {
  it.each([
    ["The Simpsons", "The Simpsons", true],
    ["The Simpsons", "The Simpsons Movie", false],
    ["The Simpsons", "The Simpsons S01E01", false],
    ["The Simpsons S01E01", "The Simpsons S01E01", true],
    ["The Simpsons Movie", "The Simpsons Movie", true],
    ["American Horror Story", "American Story Horror", false],
    ["S W A T", "S.W.A.T.", true],
  ] as const)("titleMatch(%s, %s) => %s", (a, b, expected) => {
    expect(titleMatch(a, b)).toBe(expected);
  });
});

describe("getLevRatio", () => {
  it.each([
    ["The Simpsons", "The Simpsons", 1],
    ["The Simpsons", "The Simpsons Movie", 0],
    ["The Simpsons", "The Simpsons S01E01", 0],
    ["The Simpsons S01E01", "The Simpsons S01E01", 1],
    ["The Simpsons Movie", "The Simpsons Movie", 1],
    ["American Horror Story", "American Story Horror", 0],
    ["S W A T", "S.W.A.T.", 1],
  ] as const)("getLevRatio(%s, %s) => %s", (a, b, expected) => {
    expect(getLevRatio(a, b)).toBe(expected);
  });

  it("should throw on empty titles", () => {
    expect(() => getLevRatio("", "foo")).toThrow();
    expect(() => getLevRatio("foo", "")).toThrow();
  });

  it("should throw on invalid threshold", () => {
    expect(() => getLevRatio("a", "b", -1)).toThrow();
    expect(() => getLevRatio("a", "b", 2)).toThrow();
  });
});

describe("getLevRatio with aliases", () => {
  it("should match via alias", () => {
    const aliases = {
      jp: ["Gokushufudō", "Gokushufudou"],
      us: ["The Way of the Househusband", "The Way of the House Husband"],
      cn: ["极道主夫"],
    };
    expect(
      getLevRatio(
        "The Way of the Househusband",
        "The Way of the House Husband",
        0.85,
        aliases,
      ),
    ).toBe(1);
  });

  it("should match via foreign alias", () => {
    const aliases = {
      jp: ["Gokushufudō", "Gokushufudou"],
      us: ["The Way of the Househusband"],
      cn: ["极道主夫"],
    };
    expect(
      getLevRatio("The Way of the Househusband", "极道主夫", 0.85, aliases),
    ).toBe(1);
  });

  it("should match without aliases", () => {
    expect(getLevRatio("The Simpsons", "The Simpsons", 0.85, {})).toBe(1);
  });
});

describe("integration with parse", () => {
  it.each([
    ["The Walking Dead S05E03 720p HDTV x264-ASAP", "The Walking Dead", true],
    [
      "marvels.agents.of.s.h.i.e.l.d.s03.1080p.bluray.x264-shortbrehd[rartv]",
      "Marvel's Agents of S.H.I.E.L.D.",
      true,
    ],
    ["The Walking Dead", "Oppenheimer", false],
  ] as const)(
    "parse(%s) matches %s => %s",
    (rawTitle, correctTitle, expected) => {
      const data = parse(rawTitle);
      const match = titleMatch(correctTitle, data.title);
      expect(match).toBe(expected);

      if (expected) {
        expect(getLevRatio(correctTitle, data.title)).toBeGreaterThanOrEqual(
          0.85,
        );
      } else {
        expect(getLevRatio(correctTitle, data.title)).toBe(0);
      }
    },
  );
});
