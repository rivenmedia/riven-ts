import { it, expect, describe, vi } from "vitest";
import { z } from "zod";

import { buildSettingFields } from "./build-setting-fields.ts";

import type { SettingFieldProps } from "../_components/setting-field/setting-field.tsx";

describe("numeric schemas", () => {
  it('returns a "number" field with no constraints for an int schema with no constraints', () => {
    const schema = z.int().meta({
      title: "Number Field",
      description: "A number field with no constraints",
    });

    const field = buildSettingFields(schema, "numberField");

    expect(field).toStrictEqual<Map<string, SettingFieldProps>>(
      new Map([
        [
          "numberField",
          {
            type: "number",
            config: {
              label: "Number Field",
              description: "A number field with no constraints",
              name: "numberField",
              step: 1,
            },
          },
        ],
      ]),
    );
  });

  it('returns a "number" field without validation rules for an int schema with constraints', () => {
    const schema = z.int().min(0).max(10).meta({
      title: "Number Field with Constraints",
      description: "A number field with min and max constraints",
    });

    const field = buildSettingFields(schema, "numberField");

    expect(field).toStrictEqual<Map<string, SettingFieldProps>>(
      new Map([
        [
          "numberField",
          {
            type: "number",
            config: {
              label: "Number Field with Constraints",
              description: "A number field with min and max constraints",
              name: "numberField",
              step: 1,
            },
          },
        ],
      ]),
    );
  });

  it("assigns the step value when multipleOf is specified in the schema", () => {
    const schema = z.int().multipleOf(5).meta({
      title: "Number Field with Multiple Of",
      description: "A number field with multipleOf constraint",
    });

    const field = buildSettingFields(schema, "numberField");

    expect(field).toStrictEqual<Map<string, SettingFieldProps>>(
      new Map([
        [
          "numberField",
          {
            type: "number",
            config: {
              label: "Number Field with Multiple Of",
              description: "A number field with multipleOf constraint",
              name: "numberField",
              step: 5,
            },
          },
        ],
      ]),
    );
  });

  it("unwraps optional schemas correctly", () => {
    const schema = z
      .number()
      .meta({
        title: "Number Field",
        description: "An optional number field",
      })
      .optional();

    const field = buildSettingFields(schema, "numberField");

    expect(field).toStrictEqual<Map<string, SettingFieldProps>>(
      new Map([
        [
          "numberField",
          {
            type: "number",
            config: {
              label: "Number Field",
              description: "An optional number field",
              name: "numberField",
              step: 0.01,
            },
          },
        ],
      ]),
    );
  });

  it("unwraps default schemas correctly", () => {
    const schema = z.number().default(1).meta({
      title: "Number Field",
      description: "A number field with a default",
    });

    const field = buildSettingFields(schema, "numberField");

    expect(field).toStrictEqual<Map<string, SettingFieldProps>>(
      new Map([
        [
          "numberField",
          {
            type: "number",
            config: {
              label: "Number Field",
              description: "A number field with a default",
              name: "numberField",
              step: 0.01,
            },
          },
        ],
      ]),
    );
  });

  it("keeps metadata applied to an optional wrapper", () => {
    const schema = z.number().optional().meta({
      title: "Number Field",
      description: "An optional number field",
    });

    const field = buildSettingFields(schema, "numberField");

    expect(field).toStrictEqual<Map<string, SettingFieldProps>>(
      new Map([
        [
          "numberField",
          {
            type: "number",
            config: {
              label: "Number Field",
              description: "An optional number field",
              name: "numberField",
              step: 0.01,
            },
          },
        ],
      ]),
    );
  });
});

describe("emptied number inputs", () => {
  const buildNumberConfig = (schema: z.ZodType) => {
    const [field] = buildSettingFields(schema, "numberField").values();

    expect.assert(field?.type === "number");

    return field.config;
  };

  it.each([
    ["a nullable number", z.int().nullable()],
    ["a defaulted nullable number", z.int().nullable().default(60)],
    ["a served nullable number", z.union([z.int(), z.null()]).default(60)],
  ])("saves an emptied input as null for %s", (_, schema) => {
    expect(buildNumberConfig(schema)).toHaveProperty("nullable", true);
  });

  it.each([
    ["an optional number", z.int().optional()],
    ["a defaulted number", z.int().default(3)],
  ])("resets an emptied input for %s", (_, schema) => {
    expect(buildNumberConfig(schema)).not.toHaveProperty("nullable");
  });
});

describe("unions with null", () => {
  it.each([
    ["number", z.union([z.int(), z.null()]), "number"],
    ["boolean", z.union([z.boolean(), z.null()]), "nullable_boolean"],
  ])(
    "builds a %s union with null as its non-null member",
    (_, schema, type) => {
      const [field] = buildSettingFields(
        schema.meta({ title: "Field" }),
        "field",
      ).values();

      expect(field).toMatchObject({
        type,
        config: { label: "Field", name: "field" },
      });
    },
  );

  it("marks the non-null member as nullable", () => {
    const [field] = buildSettingFields(
      z.union([z.null(), z.string()]),
      "field",
    ).values();

    expect(field).toMatchObject({
      type: "text",
      config: { nullable: true },
    });
  });

  it.each([
    ["of non-null members", z.union([z.int(), z.string()])],
    ["of more than two members", z.union([z.int(), z.string(), z.null()])],
    ["of only null", z.union([z.null(), z.null()])],
  ])("skips other unions %s", (_, schema) => {
    expect(buildSettingFields(schema, "field")).toStrictEqual(new Map());
  });
});

describe("boolean schemas", () => {
  it('returns a "boolean" field when the schema is not nullable', () => {
    const schema = z.boolean().meta({ title: "Boolean Field" });
    const field = buildSettingFields(schema, "booleanField");

    expect(field).toStrictEqual<Map<string, SettingFieldProps>>(
      new Map([
        [
          "booleanField",
          {
            type: "boolean",
            config: {
              label: "Boolean Field",
              name: "booleanField",
            },
          },
        ],
      ]),
    );
  });

  it('returns a "boolean" field when the schema has a default', () => {
    const schema = z.boolean().default(false).meta({ title: "Boolean Field" });
    const field = buildSettingFields(schema, "booleanField");

    expect(field).toStrictEqual<Map<string, SettingFieldProps>>(
      new Map([
        [
          "booleanField",
          {
            type: "boolean",
            config: {
              label: "Boolean Field",
              name: "booleanField",
            },
          },
        ],
      ]),
    );
  });

  it('returns a "boolean" field when the schema is optional', () => {
    const schema = z.boolean().optional();
    const [field] = buildSettingFields(schema, "booleanField").values();

    expect(field?.type).toBe("boolean");
  });

  it('returns a "nullable_boolean" field for a nullable schema without other wrappers', () => {
    const schema = z.boolean().nullable();
    const [field] = buildSettingFields(schema, "booleanField").values();

    expect(field?.type).toBe("nullable_boolean");
  });

  it('returns a "boolean" field for a defaulted boolean served as JSON Schema', () => {
    const schema = z.fromJSONSchema(
      z.toJSONSchema(
        z.object({ dubbedAnimeOnly: z.boolean().default(false) }),
        {
          io: "input",
        },
      ),
    );
    const [field] = buildSettingFields(schema).values();

    expect(field?.type).toBe("boolean");
  });

  it('returns a "nullable_boolean" field when the schema is nullable', () => {
    const schema = z
      .boolean()
      .meta({ title: "Nullable Boolean Field" })
      .nullish();

    const field = buildSettingFields(schema, "nullableBooleanField");

    expect(field).toStrictEqual<Map<string, SettingFieldProps>>(
      new Map([
        [
          "nullableBooleanField",
          {
            type: "nullable_boolean",
            config: {
              label: "Nullable Boolean Field",
              name: "nullableBooleanField",
            },
          },
        ],
      ]),
    );
  });
});

describe("record schemas", () => {
  it("skips them", () => {
    const schema = z.record(z.string(), z.string());

    const field = buildSettingFields(schema, "recordField");

    expect(field).toStrictEqual(new Map());
  });
});

describe("string schemas", () => {
  it('returns a "text" field when "meta().secret" is falsy', () => {
    const schema = z.string().meta({ title: "Text Field" });

    const field = buildSettingFields(schema, "textField");

    expect(field).toStrictEqual<Map<string, SettingFieldProps>>(
      new Map([
        [
          "textField",
          {
            type: "text",
            config: {
              label: "Text Field",
              name: "textField",
            },
          },
        ],
      ]),
    );
  });

  it('returns a "secret" field when "meta().secret" is true', () => {
    const schema = z.string().meta({ title: "Secret Field", secret: true });

    const field = buildSettingFields(schema, "secretField");

    expect(field).toStrictEqual<Map<string, SettingFieldProps>>(
      new Map([
        [
          "secretField",
          {
            type: "secret",
            config: {
              label: "Secret Field",
              name: "secretField",
            },
          },
        ],
      ]),
    );
  });

  it("sets the secret state and reset handler from the context", () => {
    const schema = z.string().meta({ title: "API Key", secret: true });
    const onResetSecret = vi.fn<(path: string) => void>();

    const field = buildSettingFields(
      schema,
      "apiKey",
      {},
      {
        secretStates: new Map([["apiKey", "custom"]]),
        onResetSecret,
      },
    );

    expect(field.get("apiKey")).toStrictEqual({
      type: "secret",
      config: expect.objectContaining({
        secretState: "custom",
        onReset: expect.any(Function),
      }),
    });

    const setting = field.get("apiKey");

    if (setting?.type === "secret") {
      setting.config.onReset?.();
    }

    expect(onResetSecret).toHaveBeenCalledExactlyOnceWith("apiKey");
  });

  it("marks fields as locked when listed in the context", () => {
    const schema = z.object({
      port: z.number(),
      host: z.string(),
      nested: z.object({ inner: z.string() }),
    });

    const fields = buildSettingFields(
      schema,
      undefined,
      {},
      { lockedFields: new Set(["port", "nested.inner"]) },
    );

    expect(fields.get("port")?.config).toMatchObject({ locked: true });
    expect(fields.get("host")?.config).not.toHaveProperty("locked", true);

    const group = fields.get("nested");

    expect(group?.type).toBe("group");
    expect(
      group?.type === "group" ? group.config.schema[0]?.config : undefined,
    ).toMatchObject({ locked: true });
  });

  it("doesn't add validation rules for a string schema's size constraints", () => {
    const schema = z
      .string()
      .min(5)
      .max(10)
      .meta({ title: "Sized Text Field" });

    const field = buildSettingFields(schema, "sizedTextField");

    expect(field).toStrictEqual<Map<string, SettingFieldProps>>(
      new Map([
        [
          "sizedTextField",
          {
            type: "text",
            config: {
              label: "Sized Text Field",
              name: "sizedTextField",
            },
          },
        ],
      ]),
    );
  });

  it("unwraps optional schemas correctly", () => {
    const schema = z.string().meta({ title: "Optional Text Field" }).optional();
    const field = buildSettingFields(schema, "optionalTextField");

    expect(field).toStrictEqual<Map<string, SettingFieldProps>>(
      new Map([
        [
          "optionalTextField",
          {
            type: "text",
            config: {
              label: "Optional Text Field",
              name: "optionalTextField",
            },
          },
        ],
      ]),
    );
  });
});

describe("emptied text inputs", () => {
  const buildTextConfig = (schema: z.ZodType) => {
    const [field] = buildSettingFields(schema, "textField").values();

    expect.assert(field?.type === "text");

    return field.config;
  };

  it.each([
    ["an optional", z.string().optional()],
    ["a defaulted", z.string().default("./logs")],
    ["a required", z.string()],
  ])("resets an emptied input for %s string", (_, schema) => {
    expect(buildTextConfig(schema)).not.toHaveProperty("nullable");
  });

  it.each([
    ["a nullable", z.string().nullable()],
    ["a served nullable", z.union([z.string(), z.null()]).default("x")],
  ])("saves an emptied input as null for %s string", (_, schema) => {
    expect(buildTextConfig(schema)).toHaveProperty("nullable", true);
  });
});

describe("enum schemas", () => {
  it('returns a "select" field for a string enum schema', () => {
    const schema = z
      .enum(["option-1", "option-2", "option-3"])
      .meta({ title: "Enum Field" });

    const field = buildSettingFields(schema, "enumField");

    expect(field).toStrictEqual<Map<string, SettingFieldProps>>(
      new Map([
        [
          "enumField",
          {
            type: "select",
            config: {
              label: "Enum Field",
              name: "enumField",
              options: [
                { value: "option-1", label: "option-1" },
                { value: "option-2", label: "option-2" },
                { value: "option-3", label: "option-3" },
              ],
            },
          },
        ],
      ]),
    );
  });

  it('returns a "select" field for a const enum schema', () => {
    const schema = z
      .enum({
        "Option 1": "option-1",
        "Option 2": "option-2",
        "Option 3": "option-3",
      })
      .meta({ title: "Enum Field" });

    const field = buildSettingFields(schema, "enumField");

    expect(field).toStrictEqual<Map<string, SettingFieldProps>>(
      new Map([
        [
          "enumField",
          {
            type: "select",
            config: {
              label: "Enum Field",
              name: "enumField",
              options: [
                { value: "option-1", label: "Option 1" },
                { value: "option-2", label: "Option 2" },
                { value: "option-3", label: "Option 3" },
              ],
            },
          },
        ],
      ]),
    );
  });

  it("unwraps optional schemas correctly", () => {
    const schema = z
      .enum(["option-1", "option-2", "option-3"])
      .meta({ title: "Optional Enum Field" })
      .optional();

    const field = buildSettingFields(schema, "optionalEnumField");

    expect(field).toStrictEqual<Map<string, SettingFieldProps>>(
      new Map([
        [
          "optionalEnumField",
          {
            type: "select",
            config: {
              label: "Optional Enum Field",
              name: "optionalEnumField",
              options: [
                { value: "option-1", label: "option-1" },
                { value: "option-2", label: "option-2" },
                { value: "option-3", label: "option-3" },
              ],
            },
          },
        ],
      ]),
    );
  });
});

describe("array schemas", () => {
  it('returns a "string_array" field for a string array schema', () => {
    const schema = z.string().array().meta({ title: "String Array Field" });

    const field = buildSettingFields(schema, "stringArrayField");

    expect(field).toStrictEqual<Map<string, SettingFieldProps>>(
      new Map([
        [
          "stringArrayField",
          {
            type: "string_array",
            config: {
              label: "String Array Field",
              name: "stringArrayField",
            },
          },
        ],
      ]),
    );
  });

  it('returns a "string_array" field for an enum array schema', () => {
    const schema = z
      .enum(["option-1", "option-2", "option-3"])
      .array()
      .meta({ title: "Enum Array Field" });

    const field = buildSettingFields(schema, "enumArrayField");

    expect(field).toStrictEqual<Map<string, SettingFieldProps>>(
      new Map([
        [
          "enumArrayField",
          {
            type: "string_array",
            config: {
              label: "Enum Array Field",
              name: "enumArrayField",
            },
          },
        ],
      ]),
    );
  });

  it.each([
    ["number", z.number().array()],
    ["union", z.array(z.union([z.url(), z.email()]))],
  ])("skips arrays of %s elements", (_, schema) => {
    const field = buildSettingFields(schema, "unsupported");

    expect(field).toStrictEqual(new Map());
  });

  it("skips an unsupported array without affecting its siblings", () => {
    const schema = z.object({
      urls: z.array(z.union([z.url(), z.email()])),
      name: z.string(),
    });

    const field = buildSettingFields(schema);

    expect([...field.keys()]).toStrictEqual(["name"]);
  });

  it("unwraps optional schemas correctly", () => {
    const schema = z
      .string()
      .array()
      .meta({ title: "Optional String Array Field" })
      .optional();

    const field = buildSettingFields(schema, "optionalStringArrayField");

    expect(field).toStrictEqual<Map<string, SettingFieldProps>>(
      new Map([
        [
          "optionalStringArrayField",
          {
            type: "string_array",
            config: {
              label: "Optional String Array Field",
              name: "optionalStringArrayField",
            },
          },
        ],
      ]),
    );
  });
});

describe("object schemas", () => {
  it("converts an object schema into a settings config", () => {
    const schema = z.object({
      field1: z.string().meta({ title: "Field 1" }),
      field2: z.number().meta({ title: "Field 2" }),
      field3: z.boolean().meta({ title: "Field 3" }),
    });

    const field = buildSettingFields(schema);

    expect(field).toStrictEqual<Map<string, SettingFieldProps>>(
      new Map([
        [
          "field1",
          {
            type: "text",
            config: {
              label: "Field 1",
              name: "field1",
            },
          },
        ],
        [
          "field2",
          {
            type: "number",
            config: {
              label: "Field 2",
              name: "field2",
              step: 0.01,
            },
          },
        ],
        [
          "field3",
          {
            type: "boolean",
            config: {
              label: "Field 3",
              name: "field3",
            },
          },
        ],
      ]),
    );
  });
});

describe("custom rank schemas", () => {
  it("maps custom_rank widget objects to custom_rank fields", () => {
    const schema = z.fromJSONSchema({
      type: "object",
      properties: {
        av1: {
          type: "object",
          widget: "custom_rank",
          properties: {
            fetch: { type: "boolean" },
            rank: { type: "integer" },
          },
          required: ["fetch"],
        },
      },
    });

    expect(buildSettingFields(schema).get("av1")).toMatchObject({
      type: "custom_rank",
      config: { name: "av1" },
    });
  });

  it("builds a served rank as a custom_rank field within its category group", () => {
    const schema = z.fromJSONSchema({
      type: "object",
      properties: {
        quality: {
          type: "object",
          title: "Quality",
          additionalProperties: false,
          properties: {
            av1: {
              type: "object",
              widget: "custom_rank",
              title: "AV1",
              description: "AV1 encoded releases.",
              additionalProperties: false,
              properties: {
                fetch: { type: "boolean" },
                rank: { type: "integer" },
              },
              required: ["fetch"],
            },
          },
        },
      },
    });

    expect(
      buildSettingFields(
        schema,
        undefined,
        {},
        {
          lockedFields: new Set(["quality.av1"]),
        },
      ),
    ).toStrictEqual<Map<string, SettingFieldProps>>(
      new Map([
        [
          "quality",
          {
            type: "group",
            config: {
              name: "Quality",
              schema: [
                {
                  type: "custom_rank",
                  config: {
                    label: "AV1",
                    name: "quality.av1",
                    description: "AV1 encoded releases.",
                    locked: true,
                  },
                },
              ],
            },
          },
        ],
      ]),
    );
  });
});

describe("nested object schemas", () => {
  it("converts a nested object field into a group field", () => {
    const schema = z.object({
      require: z.string().array(),
      resolutions: z
        .object({
          r2160p: z.boolean(),
          r1080p: z.boolean(),
        })
        .meta({ title: "Resolutions" }),
    });

    const field = buildSettingFields(schema);

    expect(field).toStrictEqual<Map<string, SettingFieldProps>>(
      new Map([
        [
          "require",
          {
            type: "string_array",
            config: {
              label: "Require",
              name: "require",
            },
          },
        ],
        [
          "resolutions",
          {
            type: "group",
            config: {
              name: "Resolutions",
              schema: [
                {
                  type: "boolean",
                  config: {
                    label: "R2160p",
                    name: "resolutions.r2160p",
                  },
                },
                {
                  type: "boolean",
                  config: {
                    label: "R1080p",
                    name: "resolutions.r1080p",
                  },
                },
              ],
            },
          },
        ],
      ]),
    );
  });
});

describe("tuple schemas", () => {
  it("builds a tuple field with an item field per element", () => {
    const schema = z.tuple([z.int(), z.string(), z.int()]).meta({ title: "T" });

    const field = buildSettingFields(schema, "t");

    expect(field).toStrictEqual<Map<string, SettingFieldProps>>(
      new Map([
        [
          "t",
          {
            type: "tuple",
            config: {
              label: "T",
              name: "t",
              itemFields: [
                {
                  type: "number",
                  config: {
                    label: "T 1",
                    name: "t.0",
                    step: 1,
                  },
                },
                {
                  type: "text",
                  config: {
                    label: "T 2",
                    name: "t.1",
                  },
                },
                {
                  type: "number",
                  config: {
                    label: "T 3",
                    name: "t.2",
                    step: 1,
                  },
                },
              ],
            },
          },
        ],
      ]),
    );
  });

  it("uses an element's title as its item label", () => {
    const schema = z.tuple([z.int().meta({ title: "After 2 attempts" })]);

    const field = buildSettingFields(schema, "t");
    const [tuple] = field.values();

    expect(tuple).toMatchObject({
      config: { itemFields: [{ config: { label: "After 2 attempts" } }] },
    });
  });

  it("skips tuples with a rest element", () => {
    const schema = z.tuple([z.int()]).rest(z.int());

    const field = buildSettingFields(schema, "t");

    expect(field).toStrictEqual(new Map());
  });
});

describe("labels", () => {
  it("prefers the title", () => {
    const [field] = buildSettingFields(
      z.string().meta({ title: "API Key" }),
      "plugin.apiKey",
    ).values();

    expect(field?.config).toMatchObject({ label: "API Key" });
  });

  it.each([
    ["scraping.dubbedAnimeOnly", "Dubbed anime only"],
    ["apiKey", "Api key"],
    ["resolutions.r2160p", "R2160p"],
    ["url", "Url"],
  ])("humanises the last segment of an untitled %s", (key, label) => {
    const [field] = buildSettingFields(z.string(), key).values();

    expect(field?.config).toMatchObject({ label });
  });
});

describe("default schemas", () => {
  it("unwraps the inner type correctly", () => {
    const schema = z
      .string()
      .meta({
        title: "Default String Field",
        description: "A default string field",
      })
      .default("default value");

    const field = buildSettingFields(schema, "defaultStringField");

    expect(field).toStrictEqual<Map<string, SettingFieldProps>>(
      new Map([
        [
          "defaultStringField",
          {
            type: "text",
            config: {
              label: "Default String Field",
              description: "A default string field",
              name: "defaultStringField",
            },
          },
        ],
      ]),
    );
  });

  it("keeps metadata applied to the wrapper", () => {
    const schema = z.number().default(10).meta({
      title: "Number Field",
      description: "An optional number field",
    });

    const field = buildSettingFields(schema, "numberField");

    expect(field).toStrictEqual<Map<string, SettingFieldProps>>(
      new Map([
        [
          "numberField",
          {
            type: "number",
            config: {
              label: "Number Field",
              description: "An optional number field",
              name: "numberField",
              step: 0.01,
            },
          },
        ],
      ]),
    );
  });
});
