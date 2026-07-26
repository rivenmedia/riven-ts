import { describe, expect, it } from "vitest";

import { evaluateRule } from "./evaluate-rule.ts";

import type { ItemFacts } from "./item-facts.ts";
import type { LibrarySectionRule } from "@repo/util-plugin-sdk/schemas/library-section/index";

const NOW = Date.parse("2026-07-01T00:00:00.000Z");

const buildFacts = (overrides: Partial<ItemFacts> = {}): ItemFacts => ({
  id: "00000000-0000-0000-0000-000000000001",
  type: "movie",
  title: "alien",
  genres: ["horror", "science fiction"],
  year: 1979,
  releaseDate: Date.parse("1979-05-25T00:00:00.000Z"),
  createdAt: Date.parse("2026-06-01T00:00:00.000Z"),
  language: "en",
  country: "us",
  network: null,
  contentRating: "r",
  state: "completed",
  isAnime: false,
  runtime: 117,
  fileSize: 8_000_000_000,
  stream: {
    resolution: "1080p",
    quality: "bluray",
    codec: "h264",
    hdr: ["hdr10"],
    audio: ["truehd", "atmos"],
    remux: true,
    group: "sparks",
  },
  ...overrides,
});

const condition = (
  field: string,
  op: string,
  value: unknown,
): LibrarySectionRule =>
  ({ type: "condition", field, op, value }) as LibrarySectionRule;

const check = (rule: LibrarySectionRule, facts = buildFacts()) =>
  evaluateRule(rule, facts, NOW);

describe("string operators", () => {
  it.each([
    ["eq", "alien", true],
    ["eq", "Alien", true],
    ["eq", "predator", false],
    ["neq", "predator", true],
    ["contains", "lie", true],
    ["contains", "zzz", false],
    ["startsWith", "ali", true],
    ["startsWith", "lie", false],
    ["endsWith", "ien", true],
  ])("title %s %o is %o", (op, value, expected) => {
    expect(check(condition("title", op, value))).toBe(expected);
  });

  it.each([
    ["in", ["en", "ja"], true],
    ["in", ["ja", "ko"], false],
    ["nin", ["ja", "ko"], true],
    ["nin", ["en"], false],
  ])("language %s %o is %o", (op, value, expected) => {
    expect(check(condition("language", op, value))).toBe(expected);
  });

  it("matches case-insensitively on the operand", () => {
    expect(check(condition("contentRating", "in", ["R", "NC-17"]))).toBe(true);
  });
});

describe("string array operators", () => {
  it.each([
    ["includes", "horror", true],
    ["includes", "comedy", false],
    ["excludes", "comedy", true],
    ["excludes", "horror", false],
    ["includesAny", ["comedy", "horror"], true],
    ["includesAny", ["comedy", "romance"], false],
    ["includesAll", ["horror", "science fiction"], true],
    ["includesAll", ["horror", "comedy"], false],
    ["isEmpty", false, true],
    ["isEmpty", true, false],
  ])("genres %s %o is %o", (op, value, expected) => {
    expect(check(condition("genres", op, value))).toBe(expected);
  });

  it("normalises the operand case", () => {
    expect(check(condition("genres", "includes", "Science Fiction"))).toBe(
      true,
    );
  });

  it("treats an item with no genres as empty", () => {
    const facts = buildFacts({ genres: [] });

    expect(check(condition("genres", "isEmpty", true), facts)).toBe(true);
    expect(check(condition("genres", "includes", "horror"), facts)).toBe(false);
  });
});

describe("number operators", () => {
  it.each([
    ["eq", 1979, true],
    ["neq", 1979, false],
    ["gt", 1978, true],
    ["gt", 1979, false],
    ["gte", 1979, true],
    ["lt", 1980, true],
    ["lte", 1979, true],
    ["between", [1970, 1980], true],
    ["between", [1980, 1990], false],
  ])("year %s %o is %o", (op, value, expected) => {
    expect(check(condition("year", op, value))).toBe(expected);
  });
});

describe("date operators", () => {
  it.each([
    ["before", "2000-01-01", true],
    ["before", "1970-01-01", false],
    ["after", "1970-01-01", true],
    ["after", "2000-01-01", false],
    ["between", ["1979-01-01", "1979-12-31"], true],
    ["between", ["1980-01-01", "1989-12-31"], false],
  ])("releaseDate %s %o is %o", (op, value, expected) => {
    expect(check(condition("releaseDate", op, value))).toBe(expected);
  });

  describe("inLastDays", () => {
    it("uses the injected clock rather than the real one", () => {
      // The item was created 30 days before NOW.
      const rule = condition("createdAt", "inLastDays", 45);

      expect(evaluateRule(rule, buildFacts(), NOW)).toBe(true);
      expect(evaluateRule(rule, buildFacts(), NOW + 60 * 86_400_000)).toBe(
        false,
      );
    });

    it("excludes items older than the window", () => {
      expect(check(condition("createdAt", "inLastDays", 7))).toBe(false);
    });
  });
});

describe("boolean operators", () => {
  it.each([
    [false, false, true],
    [false, true, false],
    [true, true, true],
  ])("isAnime %o is %o gives %o", (actual, value, expected) => {
    expect(
      check(condition("isAnime", "is", value), buildFacts({ isAnime: actual })),
    ).toBe(expected);
  });
});

describe("stream fields", () => {
  it("reads through to the nested stream facts", () => {
    expect(check(condition("stream.resolution", "eq", "1080p"))).toBe(true);
    expect(check(condition("stream.remux", "is", true))).toBe(true);
    expect(check(condition("stream.audio", "includes", "atmos"))).toBe(true);
  });

  it("treats every stream field as absent when there is no active stream", () => {
    const facts = buildFacts({ stream: null });

    expect(check(condition("stream.resolution", "eq", "1080p"), facts)).toBe(
      false,
    );
    expect(check(condition("stream.remux", "is", true), facts)).toBe(false);
    expect(check(condition("stream.audio", "includes", "atmos"), facts)).toBe(
      false,
    );
  });
});

describe("composition", () => {
  const horror = condition("genres", "includes", "horror");
  const comedy = condition("genres", "includes", "comedy");

  it("requires every child of an and node", () => {
    expect(check({ type: "and", rules: [horror, comedy] })).toBe(false);
    expect(
      check({ type: "and", rules: [horror, condition("year", "lt", 2000)] }),
    ).toBe(true);
  });

  it("requires any child of an or node", () => {
    expect(check({ type: "or", rules: [horror, comedy] })).toBe(true);
    expect(check({ type: "or", rules: [comedy] })).toBe(false);
  });

  it("inverts a not node", () => {
    expect(check({ type: "not", rule: horror })).toBe(false);
    expect(check({ type: "not", rule: comedy })).toBe(true);
  });

  it("evaluates the issue's motivating shape: in one section, out of another", () => {
    // "horror, but not comedy, and either modern or from AMC"
    const rule: LibrarySectionRule = {
      type: "and",
      rules: [
        horror,
        { type: "not", rule: comedy },
        {
          type: "or",
          rules: [
            condition("year", "gte", 2000),
            condition("network", "eq", "amc"),
          ],
        },
      ],
    };

    expect(check(rule)).toBe(false);
    expect(check(rule, buildFacts({ year: 2015 }))).toBe(true);
    expect(check(rule, buildFacts({ network: "amc" }))).toBe(true);
  });

  it("matches everything when there is no rule", () => {
    expect(evaluateRule(null, buildFacts(), NOW)).toBe(true);
    expect(evaluateRule(undefined, buildFacts(), NOW)).toBe(true);
  });
});

describe("missing value semantics", () => {
  it("never satisfies a positive predicate", () => {
    const facts = buildFacts({ network: null, year: null });

    expect(check(condition("network", "eq", "amc"), facts)).toBe(false);
    expect(check(condition("network", "contains", "am"), facts)).toBe(false);
    expect(check(condition("year", "gte", 2000), facts)).toBe(false);
  });

  it("satisfies the negative string predicates", () => {
    const facts = buildFacts({ network: null });

    expect(check(condition("network", "neq", "amc"), facts)).toBe(true);
    expect(check(condition("network", "nin", ["amc"]), facts)).toBe(true);
  });

  it("inverts under a not node, so absent values match the negation", () => {
    // The surprising but composable consequence: an item with no genres
    // matches `not(genres includes "horror")`.
    const facts = buildFacts({ genres: [] });

    expect(
      check(
        { type: "not", rule: condition("genres", "includes", "horror") },
        facts,
      ),
    ).toBe(true);
  });

  it("never matches a date predicate when the date is absent", () => {
    const facts = buildFacts({ releaseDate: null });

    expect(check(condition("releaseDate", "before", "2000-01-01"), facts)).toBe(
      false,
    );
    expect(check(condition("releaseDate", "after", "1900-01-01"), facts)).toBe(
      false,
    );
  });
});

describe("purity", () => {
  it("does not mutate the facts it is given", () => {
    const facts = buildFacts();
    const snapshot = structuredClone(facts);

    check(
      {
        type: "and",
        rules: [
          condition("genres", "includesAny", ["horror"]),
          condition("stream.audio", "includes", "atmos"),
        ],
      },
      facts,
    );

    expect(facts).toStrictEqual(snapshot);
  });

  it("is deterministic for a fixed clock", () => {
    const rule = condition("createdAt", "inLastDays", 30);
    const facts = buildFacts();

    expect(evaluateRule(rule, facts, NOW)).toBe(evaluateRule(rule, facts, NOW));
  });
});
