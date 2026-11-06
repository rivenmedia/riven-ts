import { describe, expect, it } from "vitest";
import z from "zod";

import {
  flattenSettings,
  getLeafDefault,
  getLeafPaths,
  getLeafSchema,
  isSecretLeaf,
  unflattenSettings,
} from "./leaf-paths.ts";

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

  it("keeps explicit null leaves when flattening", () => {
    const nullable = z.object({
      group: z.object({ interval: z.int().nullable() }),
      timeout: z.int().nullable().default(5),
    });

    expect(
      flattenSettings(nullable, { group: { interval: null }, timeout: null }),
    ).toStrictEqual({ interval: null, timeout: null });
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

  const secret = z.string().default("secret-default").meta({ secret: true });

  it.for<[string, z.ZodType]>([
    ["default", z.string().meta({ secret: true }).default("secret-default")],
    ["transform", secret.transform((value) => value.trim())],
    ["pipe (output side)", z.string().pipe(z.string().meta({ secret: true }))],
    ["readonly", secret.readonly()],
    ["catch", secret.catch("fallback")],
    ["prefault", z.string().meta({ secret: true }).prefault("secret-default")],
    ["optional().nonoptional()", secret.optional().nonoptional()],
    ["lazy", z.lazy(() => secret)],
    ["lazy inside optional", z.lazy(() => secret).optional()],
  ])("detects a secret leaf through %s", ([, field]) => {
    expect(isSecretLeaf(z.object({ field }), "field")).toBe(true);
  });

  it("does not loop on a self-referencing lazy leaf", () => {
    const cyclic: z.ZodType = z.lazy(() => cyclic.optional());

    expect(isSecretLeaf(z.object({ cyclic }), "cyclic")).toBe(false);
  });

  it.for<[string, z.ZodType]>([
    ["readonly", z.int().default(7).readonly()],
    ["catch", z.int().default(7).catch(0)],
    ["prefault", z.int().prefault(7)],
    ["optional().nonoptional()", z.int().default(7).optional().nonoptional()],
    ["lazy", z.lazy(() => z.int().default(7))],
    ["pipe input", z.int().default(7).pipe(z.int())],
  ])("returns the default through %s", ([, field]) => {
    expect(getLeafDefault(z.object({ field }), "field")).toBe(7);
  });
});
