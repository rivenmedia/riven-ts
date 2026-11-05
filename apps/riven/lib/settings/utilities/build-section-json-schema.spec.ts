import { describe, expect, it } from "vitest";
import z from "zod";

import { buildSectionJsonSchema } from "./build-section-json-schema.ts";

import type { SecretState } from "#types/__generated__/graphql.ts";

const FakeSettings = z.object({
  apiKey: z.string().min(1).meta({ secret: true }),
  token: z.string().default("d").meta({ secret: true }),
  nested: z.object({
    password: z.string().min(1).nullable().optional().meta({ secret: true }),
    // oxlint-disable-next-line id-length
    n: z.int().default(1),
  }),
});

interface JsonSchemaNode {
  properties: Record<string, JsonSchemaNode & Record<string, unknown>>;
  required?: string[];
}

function build(states: Record<string, SecretState>) {
  return buildSectionJsonSchema(
    FakeSettings,
    new Map(Object.entries(states)),
  ) as JsonSchemaNode;
}

describe(buildSectionJsonSchema, () => {
  it("removes secret defaults but keeps non-secret defaults", () => {
    const jsonSchema = build({
      apiKey: "unset",
      token: "default",
      password: "unset",
    });

    expect(jsonSchema.properties["token"]).not.toHaveProperty("default");
    expect(jsonSchema.properties["nested"]?.properties["n"]).toHaveProperty(
      "default",
      1,
    );
  });

  it("keeps an unset secret required with its minLength", () => {
    const jsonSchema = build({
      apiKey: "unset",
      token: "default",
      password: "unset",
    });

    expect(jsonSchema.required).toContain("apiKey");
    expect(jsonSchema.properties["apiKey"]).toHaveProperty("minLength", 1);
  });

  it.for<SecretState>(["custom", "env", "default"])(
    "makes a secret in state %s optional",
    (state) => {
      const jsonSchema = build({
        apiKey: state,
        token: "default",
        password: state,
      });

      expect(jsonSchema.required).not.toContain("apiKey");
      expect(jsonSchema.properties["apiKey"]).not.toHaveProperty("minLength");
      expect(
        JSON.stringify(jsonSchema.properties["nested"]?.properties["password"]),
      ).not.toContain("minLength");
    },
  );

  it("removes the default of a secret wrapped in a transform", () => {
    const transformed = z.object({
      token: z
        .string()
        .default("secret-default")
        .meta({ secret: true })
        .transform((value) => value.trim()),
    });

    const jsonSchema = buildSectionJsonSchema(
      transformed,
      new Map([["token", "default"]]),
    );

    expect(JSON.stringify(jsonSchema)).not.toContain("secret-default");
  });

  it("keeps non-secret required fields", () => {
    const jsonSchema = build({
      apiKey: "custom",
      token: "default",
      password: "custom",
    });

    expect(jsonSchema.required).toStrictEqual(["nested"]);
  });
});
