import { describe, expect, it } from "vitest";
import z, { ZodError } from "zod";

import {
  findIgnoredStored,
  resolveSettings,
  validateSettings,
} from "./resolve-settings.ts";

const schema = z.object({
  group: z.object({
    limit: z.int().default(5),
    label: z.string().default("label"),
  }),
  flag: z.boolean().default(false),
});

describe(resolveSettings, () => {
  it("env beats stored and locks the leaf", () => {
    const result = resolveSettings({
      schema,
      stored: { limit: 2 },
      env: { limit: "3" },
    });

    expect(result.value.group.limit).toBe(3);
    expect(result.lockedLeaves.has("limit")).toBe(true);
    expect(result.ignoredStored).toStrictEqual([]);
  });

  it("stored beats default", () => {
    const result = resolveSettings({ schema, stored: { limit: 2 }, env: {} });

    expect(result.value.group.limit).toBe(2);
    expect(result.value.group.label).toBe("label");
    expect(result.lockedLeaves.size).toBe(0);
  });

  it("drops invalid stored leaves and falls back to default", () => {
    const result = resolveSettings({
      schema,
      stored: { limit: "bad" },
      env: {},
    });

    expect(result.value.group.limit).toBe(5);
    expect(result.ignoredStored).toStrictEqual([
      { leaf: "limit", path: "group.limit", message: expect.any(String) },
    ]);
  });

  it("round-trips a stored explicit null", () => {
    const nullable = z.object({
      grp: z.object({ url: z.string().nullable().default("https://x") }),
    });

    const result = resolveSettings({
      schema: nullable,
      stored: { url: null },
      env: {},
    });

    expect(result.value.grp.url).toBeNull();
    expect(result.ignoredStored).toStrictEqual([]);
  });

  describe("with an issue that cannot be attributed to a leaf", () => {
    const refined = z.object({
      range: z
        .object({ min: z.int().default(1), max: z.int().default(10) })
        .refine(({ min, max }) => min <= max, "min must not exceed max"),
      flag: z.boolean().default(false),
    });

    it("drops every stored leaf and resolves from env and defaults", () => {
      const result = resolveSettings({
        schema: refined,
        stored: { min: 20, flag: true },
        env: {},
      });

      expect(result.value).toStrictEqual({
        range: { min: 1, max: 10 },
        flag: false,
      });

      expect(result.ignoredStored).toStrictEqual([
        {
          leaf: "min",
          path: "range.min",
          message: expect.stringContaining("min must not exceed max"),
        },
        {
          leaf: "flag",
          path: "flag",
          message: expect.stringContaining("min must not exceed max"),
        },
      ]);
    });

    it("keeps env values when dropping stored leaves", () => {
      const result = resolveSettings({
        schema: refined,
        stored: { min: 20 },
        env: { max: "15" },
      });

      expect(result.value.range).toStrictEqual({ min: 1, max: 15 });
      expect(result.ignoredStored).toStrictEqual([
        { leaf: "min", path: "range.min", message: expect.any(String) },
      ]);
    });

    it("throws when env and defaults alone are invalid", () => {
      expect(() =>
        resolveSettings({ schema: refined, stored: {}, env: { min: "20" } }),
      ).toThrow(ZodError);

      expect(() =>
        resolveSettings({
          schema: refined,
          stored: { max: 30 },
          env: { min: "40" },
        }),
      ).toThrow(ZodError);
    });
  });

  it("throws ZodError for invalid env values", () => {
    expect(() =>
      resolveSettings({ schema, stored: {}, env: { limit: "bad" } }),
    ).toThrow(ZodError);
  });

  it("throws when a required leaf is missing everywhere", () => {
    const required = z.object({ grp: z.object({ req: z.string() }) });

    expect(() =>
      resolveSettings({ schema: required, stored: {}, env: {} }),
    ).toThrow(ZodError);
  });
});

describe(findIgnoredStored, () => {
  const required = z.object({
    grp: z.object({ req: z.string(), limit: z.int().default(5) }),
    flag: z.boolean().default(false),
  });

  it("reports invalid stored leaves whilst a required leaf is missing", () => {
    expect(
      findIgnoredStored({
        schema: required,
        stored: { limit: "bad", flag: true },
        env: {},
      }),
    ).toStrictEqual([
      { leaf: "limit", path: "grp.limit", message: expect.any(String) },
    ]);
  });

  it("does not report stored leaves for an invalid env value", () => {
    expect(
      findIgnoredStored({
        schema,
        stored: { label: "stored" },
        env: { limit: "bad" },
      }),
    ).toStrictEqual([]);
  });
});

describe(validateSettings, () => {
  it("returns issues with dotted paths", () => {
    expect(validateSettings(schema, { limit: "bad" })).toStrictEqual([
      { path: "group.limit", message: expect.any(String) },
    ]);
  });

  it("returns [] when valid", () => {
    expect(validateSettings(schema, { limit: 1 })).toStrictEqual([]);
  });
});
