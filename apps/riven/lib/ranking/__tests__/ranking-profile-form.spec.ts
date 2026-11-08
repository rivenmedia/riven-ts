import { expect, it } from "vitest";
import z from "zod";

import {
  buildRankingProfileJsonSchema,
  fromProfileFormValues,
  toProfileFormValues,
} from "../ranking-profile-form.ts";

import type { JSONSchema } from "zod/v4/core";

type Node = JSONSchema.JSONSchema;

function child(node: Node, ...keys: string[]): Node {
  let current = node;

  for (const key of keys) {
    const next = current.properties?.[key];

    if (typeof next !== "object") {
      throw new TypeError(`Missing JSON schema property "${key}"`);
    }

    current = next;
  }

  return current;
}

const validValues = toProfileFormValues({
  name: "Valid",
  description: null,
  rankingModel: {},
  settings: {},
});

it("groups ranks by category with custom_rank widgets", () => {
  const schema = buildRankingProfileJsonSchema();
  const ranks = child(schema, "ranks");

  expect(Object.keys(ranks.properties ?? {})).toStrictEqual([
    "quality",
    "rips",
    "hdr",
    "audio",
    "extras",
    "trash",
  ]);
  expect(child(ranks, "quality").title).toBe("Quality");
  expect(child(ranks, "hdr").title).toBe("HDR");
  expect(child(ranks, "quality", "av1")["widget"]).toBe("custom_rank");
});

it("lists rank keys in RTN field order within each category", () => {
  const quality = child(buildRankingProfileJsonSchema(), "ranks", "quality");

  expect(Object.keys(quality.properties ?? {}).slice(0, 4)).toStrictEqual([
    "av1",
    "avc",
    "bluray",
    "dvd",
  ]);
});

it("serves a JSON schema the frontend can rebuild with the widget meta", () => {
  const rebuilt = z.fromJSONSchema(buildRankingProfileJsonSchema());

  expect(rebuilt.safeParse(validValues).success).toBe(true);
});

it("maps null ranks to fetch:false and back", () => {
  const values = toProfileFormValues({
    rankingModel: { av1: 500 },
    settings: {},
    name: "A",
    description: null,
  });

  expect(values.ranks.quality["av1"]).toStrictEqual({
    fetch: true,
    rank: 500,
  });
  expect(values.ranks.trash["cam"]).toStrictEqual({ fetch: false });
  expect(fromProfileFormValues(values)).toStrictEqual({
    issues: [],
    name: "A",
    description: null,
    config: { rankingModel: { av1: 500 } },
  });
});

it("fills in effective settings and stores only overrides", () => {
  const values = toProfileFormValues({
    name: "4K",
    description: "d",
    rankingModel: {},
    settings: { resolutions: { r2160p: true }, require: ["x"] },
  });

  expect(values.settings.resolutions).toMatchObject({
    r2160p: true,
    r1080p: true,
  });
  expect(values.settings.patterns).toMatchObject({ requiredPatterns: ["x"] });
  expect(fromProfileFormValues(values)).toMatchObject({
    issues: [],
    config: { settings: { resolutions: { r2160p: true }, require: ["x"] } },
  });
});

it("trims the name and stores a fully default profile as empty config", () => {
  expect(
    fromProfileFormValues({ ...validValues, name: "  Blank  " }),
  ).toStrictEqual({
    issues: [],
    name: "Blank",
    description: null,
    config: {},
  });
});

it("reports a missing rank on a fetched field at its form path", () => {
  const values = {
    ...validValues,
    ranks: {
      ...validValues.ranks,
      quality: { ...validValues.ranks.quality, av1: { fetch: true } },
    },
  };

  expect(fromProfileFormValues(values).issues).toContainEqual(
    expect.objectContaining({ path: "ranks.quality.av1.rank" }),
  );
});

it("reports form issues at dotted paths", () => {
  const { issues } = fromProfileFormValues({
    ...validValues,
    name: " ",
    settings: {
      ...validValues.settings,
      options: { ...validValues.settings.options, titleSimilarity: 2 },
    },
  });

  expect(issues.map(({ path }) => path)).toStrictEqual([
    "name",
    "settings.options.titleSimilarity",
  ]);
});

it("ignores the rank of a field that is not fetched", () => {
  const values = {
    ...validValues,
    ranks: {
      ...validValues.ranks,
      trash: { ...validValues.ranks.trash, cam: { fetch: false, rank: 5 } },
    },
  };

  expect(fromProfileFormValues(values)).toMatchObject({
    issues: [],
    config: {},
  });
});

it.each([
  ["at the top level", { ...validValues, bogusTop: 1 }, "bogusTop"],
  [
    "under ranks",
    { ...validValues, ranks: { ...validValues.ranks, extraGroup: {} } },
    "ranks.extraGroup",
  ],
  [
    "inside a rank category",
    {
      ...validValues,
      ranks: {
        ...validValues.ranks,
        quality: { ...validValues.ranks.quality, av1x: { fetch: false } },
      },
    },
    "ranks.quality.av1x",
  ],
  [
    "inside a rank field",
    {
      ...validValues,
      ranks: {
        ...validValues.ranks,
        quality: {
          ...validValues.ranks.quality,
          av1: { fetch: false, extra: true },
        },
      },
    },
    "ranks.quality.av1.extra",
  ],
  [
    "under a settings group",
    {
      ...validValues,
      settings: {
        ...validValues.settings,
        options: { ...validValues.settings.options, nope: true },
      },
    },
    "settings.options.nope",
  ],
  [
    "under settings",
    { ...validValues, settings: { ...validValues.settings, extra: {} } },
    "settings.extra",
  ],
])("reports an unknown key %s at its dotted path", (_, values, path) => {
  expect(fromProfileFormValues(values).issues).toStrictEqual([
    { path, message: expect.any(String) },
  ]);
});

it("serves a JSON schema that disallows unknown keys", () => {
  const schema = buildRankingProfileJsonSchema();

  expect(schema.additionalProperties).toBe(false);
  expect(child(schema, "ranks").additionalProperties).toBe(false);
  expect(child(schema, "ranks", "quality").additionalProperties).toBe(false);
  expect(child(schema, "ranks", "quality", "av1").additionalProperties).toBe(
    false,
  );
  expect(child(schema, "settings").additionalProperties).toBe(false);
  expect(child(schema, "settings", "options").additionalProperties).toBe(false);
});
