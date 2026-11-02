import { describe, expect, it } from "vitest";
import z from "zod";

import {
  flattenSettings,
  getLeafDefault,
  getLeafPaths,
  getLeafSchema,
  isSecretLeaf,
  unflattenSettings,
} from "../leaf-paths.ts";

const schema = z.object({
  group: z.object({ limit: z.string() }),
  flag: z.int().default(1),
});

describe(getLeafPaths, () => {
  it("maps leaf keys to their nested paths", () => {
    expect(getLeafPaths(schema)).toStrictEqual(
      new Map([
        ["limit", ["group", "limit"]],
        ["flag", ["flag"]],
      ]),
    );
  });

  it("throws on duplicate leaf keys", () => {
    const dup = z.object({
      group: z.object({ limit: z.string() }),
      other: z.object({ limit: z.string() }),
    });

    expect(() => getLeafPaths(dup)).toThrow(/Duplicate settings key "limit"/u);
  });
});

describe("unflattenSettings / flattenSettings", () => {
  it("nests flat values under their group", () => {
    expect(unflattenSettings(schema, { limit: "value" })).toStrictEqual({
      group: { limit: "value" },
    });
  });

  it("materialises empty display groups", () => {
    expect(unflattenSettings(schema, {})).toStrictEqual({ group: {} });
  });

  it("places group moved field under its new group", () => {
    const moved = z.object({
      group: z.object({ extra: z.string().optional() }),
      other: z.object({ limit: z.string() }),
    });

    expect(unflattenSettings(moved, { limit: "value" })).toStrictEqual({
      group: {},
      other: { limit: "value" },
    });
  });

  it("flatten is the inverse of unflatten", () => {
    const flat = { limit: "value", flag: 2 };

    expect(
      flattenSettings(schema, unflattenSettings(schema, flat)),
    ).toStrictEqual(flat);
  });
});

describe("leaf helpers", () => {
  it("returns the leaf default", () => {
    expect(getLeafDefault(schema, "flag")).toBe(1);
    expect(getLeafDefault(schema, "limit")).toBeUndefined();
  });

  it("returns the input default of a transformed leaf", () => {
    const transformed = z.object({
      attempts: z
        .int()
        .default(10)
        .transform((value) => value * 2)
        .describe("Attempts"),
    });

    expect(getLeafDefault(transformed, "attempts")).toBe(10);
  });

  it("returns the leaf schema", () => {
    expect(getLeafSchema(schema, "limit")).toBeInstanceOf(z.ZodString);
  });

  it("detects secret leaves through wrappers", () => {
    const custom = z.object({
      grp: z.object({
        token: z.string().meta({ secret: true }).optional(),
        plain: z.string().optional(),
        wrapped: z.string().optional().meta({ secret: true }),
      }),
    });

    expect(isSecretLeaf(custom, "token")).toBe(true);
    expect(isSecretLeaf(custom, "wrapped")).toBe(true);
    expect(isSecretLeaf(custom, "plain")).toBe(false);
  });
});
