import { describe, expect, it } from "vitest";
import z, { ZodError } from "zod";

import { resolveSettings, validateSettings } from "../resolve-settings.ts";

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
      { path: "group.limit", message: expect.any(String) },
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
