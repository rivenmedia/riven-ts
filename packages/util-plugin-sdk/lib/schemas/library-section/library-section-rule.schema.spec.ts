import { describe, expect, it } from "vitest";
import z from "zod";

import {
  LibrarySectionRuleRoot,
  MAX_RULE_DEPTH,
  measureRule,
} from "./library-section-rule.schema.ts";

import type { LibrarySectionRule } from "./library-section-rule.schema.ts";

const horror: LibrarySectionRule = {
  type: "condition",
  field: "genres",
  op: "includesAny",
  value: ["horror"],
};

describe("conditions", () => {
  it("accepts a bare condition as a whole rule", () => {
    expect(LibrarySectionRuleRoot.parse(horror)).toStrictEqual(horror);
  });

  it.each([
    ["string", { field: "title", op: "contains", value: "alien" }],
    ["string list", { field: "language", op: "in", value: ["en", "ja"] }],
    ["string array", { field: "genres", op: "includesAll", value: ["a", "b"] }],
    ["number", { field: "year", op: "gte", value: 2000 }],
    ["number range", { field: "year", op: "between", value: [1990, 1999] }],
    ["date", { field: "releaseDate", op: "before", value: "2000-01-01" }],
    ["relative date", { field: "createdAt", op: "inLastDays", value: 30 }],
    ["boolean", { field: "isAnime", op: "is", value: true }],
    ["stream string", { field: "stream.resolution", op: "eq", value: "4k" }],
    ["stream boolean", { field: "stream.remux", op: "is", value: true }],
  ])("accepts a %s condition", (_label, condition) => {
    expect(
      LibrarySectionRuleRoot.safeParse({ type: "condition", ...condition })
        .success,
    ).toBe(true);
  });

  it.each([
    [
      "an operator from another kind",
      { field: "year", op: "contains", value: "x" },
    ],
    ["a value of the wrong type", { field: "year", op: "gte", value: "2000" }],
    ["an unknown field", { field: "nope", op: "eq", value: "x" }],
    [
      "a field excluded from the registry",
      { field: "rating", op: "gte", value: 5 },
    ],
    [
      "an empty operand list",
      { field: "genres", op: "includesAny", value: [] },
    ],
  ])("rejects %s", (_label, condition) => {
    expect(
      LibrarySectionRuleRoot.safeParse({ type: "condition", ...condition })
        .success,
    ).toBe(false);
  });
});

describe("composition", () => {
  it("accepts a nested and/or/not tree", () => {
    const rule = {
      type: "and",
      rules: [
        horror,
        {
          type: "not",
          rule: {
            type: "condition",
            field: "genres",
            op: "includes",
            value: "comedy",
          },
        },
        {
          type: "or",
          rules: [
            { type: "condition", field: "year", op: "gte", value: 2000 },
            { type: "condition", field: "network", op: "eq", value: "amc" },
          ],
        },
      ],
    };

    expect(LibrarySectionRuleRoot.safeParse(rule).success).toBe(true);
  });

  it("rejects a group with no children", () => {
    expect(
      LibrarySectionRuleRoot.safeParse({ type: "and", rules: [] }).success,
    ).toBe(false);
  });

  it("rejects an invalid condition nested deep in the tree", () => {
    const rule = {
      type: "and",
      rules: [
        horror,
        {
          type: "or",
          rules: [
            { type: "condition", field: "year", op: "contains", value: "x" },
          ],
        },
      ],
    };

    expect(LibrarySectionRuleRoot.safeParse(rule).success).toBe(false);
  });
});

describe("bounds", () => {
  const nest = (depth: number): LibrarySectionRule =>
    depth === 0 ? horror : { type: "not", rule: nest(depth - 1) };

  it("measures depth and node count", () => {
    expect(measureRule(nest(3))).toStrictEqual({ depth: 4, nodes: 4 });
    expect(measureRule({ type: "and", rules: [horror, horror] })).toStrictEqual(
      { depth: 2, nodes: 3 },
    );
  });

  it("accepts a tree at the depth limit", () => {
    expect(
      LibrarySectionRuleRoot.safeParse(nest(MAX_RULE_DEPTH - 1)).success,
    ).toBe(true);
  });

  it("rejects a tree past the depth limit", () => {
    const result = LibrarySectionRuleRoot.safeParse(nest(MAX_RULE_DEPTH));

    expect(result.success).toBe(false);
    expect(z.prettifyError(result.error ?? new z.ZodError([]))).toContain(
      "nested too deeply",
    );
  });
});

describe("json schema", () => {
  it("serialises for the frontend rule builder", () => {
    expect(() =>
      z.toJSONSchema(LibrarySectionRuleRoot, { io: "input" }),
    ).not.toThrow();
  });
});
