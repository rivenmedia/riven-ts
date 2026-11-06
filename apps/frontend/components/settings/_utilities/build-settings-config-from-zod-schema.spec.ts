import { it, expect, describe, vi } from "vitest";
import { z } from "zod";

import { buildSettingsConfigFromZodSchema } from "./build-settings-config-from-zod-schema.ts";

import type { SettingFieldProps } from "#components/settings/setting-field/setting-field.tsx";

describe(buildSettingsConfigFromZodSchema, () => {
  describe("numeric schemas", () => {
    it('returns a "number" field with no constraints for an int schema with no constraints', () => {
      const schema = z.int().meta({
        title: "Number Field",
        description: "A number field with no constraints",
      });

      const field = buildSettingsConfigFromZodSchema(schema, "numberField");

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
                registerOptions: {
                  required: true,
                  max: Number.MAX_SAFE_INTEGER,
                  min: Number.MIN_SAFE_INTEGER,
                  setValueAs: expect.any(Function),
                },
                step: 1,
              },
            },
          ],
        ]),
      );
    });

    it('returns a "number" field with min and/or max constraints for an int schema with constraints', () => {
      const schema = z.int().min(0).max(10).meta({
        title: "Number Field with Constraints",
        description: "A number field with min and max constraints",
      });

      const field = buildSettingsConfigFromZodSchema(schema, "numberField");

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
                registerOptions: {
                  min: 0,
                  max: 10,
                  required: true,
                  setValueAs: expect.any(Function),
                },
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

      const field = buildSettingsConfigFromZodSchema(schema, "numberField");

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
                registerOptions: {
                  required: true,
                  max: Number.MAX_SAFE_INTEGER,
                  min: Number.MIN_SAFE_INTEGER,
                  setValueAs: expect.any(Function),
                },
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

      const field = buildSettingsConfigFromZodSchema(schema, "numberField");

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
                registerOptions: {
                  required: false,
                  setValueAs: expect.any(Function),
                },
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

      const field = buildSettingsConfigFromZodSchema(schema, "numberField");

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
                registerOptions: {
                  required: false,
                  setValueAs: expect.any(Function),
                },
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

      const field = buildSettingsConfigFromZodSchema(schema, "numberField");

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
                registerOptions: {
                  required: false,
                  setValueAs: expect.any(Function),
                },
                step: 0.01,
              },
            },
          ],
        ]),
      );
    });
  });

  describe("number input values", () => {
    const getSetValueAs = (schema: z.ZodType = z.int().optional()) => {
      const [field] = buildSettingsConfigFromZodSchema(
        schema,
        "numberField",
      ).values();

      if (field?.type !== "number") {
        throw new Error("Expected a number field");
      }

      return field.config.registerOptions?.setValueAs;
    };

    it.each([
      ["a nullable number", z.int().nullable()],
      ["a defaulted nullable number", z.int().nullable().default(60)],
      ["a served nullable number", z.union([z.int(), z.null()]).default(60)],
    ])("leaves an emptied input as null for %s", (_, schema) => {
      expect(getSetValueAs(schema)?.("")).toBeNull();
    });

    it("leaves an emptied input as undefined for a defaulted number", () => {
      expect(getSetValueAs(z.int().default(3))?.("")).toBeUndefined();
    });

    it.each([[""], [undefined], [null]])(
      "leaves an empty input (%o) as undefined",
      (value) => {
        expect(getSetValueAs()?.(value)).toBeUndefined();
      },
    );

    it.each([
      ["5", 5],
      ["0", 0],
      ["-2.5", -2.5],
      [7, 7],
    ])("parses %o as a number", (value, expected) => {
      expect(getSetValueAs()?.(value)).toBe(expected);
    });
  });

  describe("unions with null", () => {
    it.each([
      ["number", z.union([z.int(), z.null()]), "number"],
      ["boolean", z.union([z.boolean(), z.null()]), "nullable_boolean"],
    ])(
      "builds a %s union with null as its non-null member",
      (_, schema, type) => {
        const [field] = buildSettingsConfigFromZodSchema(
          schema.meta({ title: "Field" }),
          "field",
        ).values();

        expect(field).toMatchObject({
          type,
          config: { label: "Field", name: "field" },
        });
      },
    );

    it("marks the non-null member as not required", () => {
      const [field] = buildSettingsConfigFromZodSchema(
        z.union([z.null(), z.string()]),
        "field",
      ).values();

      expect(field).toMatchObject({
        type: "text",
        config: { registerOptions: { required: false } },
      });
    });

    it.each([
      ["of non-null members", z.union([z.int(), z.string()])],
      ["of more than two members", z.union([z.int(), z.string(), z.null()])],
      ["of only null", z.union([z.null(), z.null()])],
    ])("skips other unions %s", (_, schema) => {
      expect(buildSettingsConfigFromZodSchema(schema, "field")).toStrictEqual(
        new Map(),
      );
    });
  });

  describe("boolean schemas", () => {
    it('returns a "boolean" field when the schema is not nullable', () => {
      const schema = z.boolean().meta({ title: "Boolean Field" });
      const field = buildSettingsConfigFromZodSchema(schema, "booleanField");

      expect(field).toStrictEqual<Map<string, SettingFieldProps>>(
        new Map([
          [
            "booleanField",
            {
              type: "boolean",
              config: {
                label: "Boolean Field",
                name: "booleanField",
                registerOptions: { required: true },
              },
            },
          ],
        ]),
      );
    });

    it('returns a "boolean" field when the schema has a default', () => {
      const schema = z
        .boolean()
        .default(false)
        .meta({ title: "Boolean Field" });
      const field = buildSettingsConfigFromZodSchema(schema, "booleanField");

      expect(field).toStrictEqual<Map<string, SettingFieldProps>>(
        new Map([
          [
            "booleanField",
            {
              type: "boolean",
              config: {
                label: "Boolean Field",
                name: "booleanField",
                registerOptions: { required: false },
              },
            },
          ],
        ]),
      );
    });

    it('returns a "boolean" field when the schema is optional', () => {
      const schema = z.boolean().optional();
      const [field] = buildSettingsConfigFromZodSchema(
        schema,
        "booleanField",
      ).values();

      expect(field?.type).toBe("boolean");
    });

    it('returns a "nullable_boolean" field for a nullable schema without other wrappers', () => {
      const schema = z.boolean().nullable();
      const [field] = buildSettingsConfigFromZodSchema(
        schema,
        "booleanField",
      ).values();

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
      const [field] = buildSettingsConfigFromZodSchema(schema).values();

      expect(field?.type).toBe("boolean");
    });

    it('returns a "nullable_boolean" field when the schema is nullable', () => {
      const schema = z
        .boolean()
        .meta({ title: "Nullable Boolean Field" })
        .nullish();

      const field = buildSettingsConfigFromZodSchema(
        schema,
        "nullableBooleanField",
      );

      expect(field).toStrictEqual<Map<string, SettingFieldProps>>(
        new Map([
          [
            "nullableBooleanField",
            {
              type: "nullable_boolean",
              config: {
                label: "Nullable Boolean Field",
                name: "nullableBooleanField",
                registerOptions: { required: true },
              },
            },
          ],
        ]),
      );
    });
  });

  describe("record schemas", () => {
    it('returns a "dictionary" field', () => {
      const schema = z
        .record(z.string(), z.string())
        .meta({ title: "Record Field" });

      const field = buildSettingsConfigFromZodSchema(schema, "recordField");

      expect(field).toStrictEqual<Map<string, SettingFieldProps>>(
        new Map([
          [
            "recordField",
            {
              type: "dictionary",
              config: {
                label: "Record Field",
                name: "recordField",
                itemFields: [
                  {
                    type: "text",
                    config: {
                      label: "Value",
                      name: "recordField.value",
                      registerOptions: {
                        required: true,
                        setValueAs: expect.any(Function),
                      },
                    },
                  },
                ],
              },
            },
          ],
        ]),
      );
    });

    it('uses the "title" meta for the key label', () => {
      const schema = z
        .record(z.string().meta({ title: "Value Title" }), z.string())
        .meta({ title: "Record Field" });

      const field = buildSettingsConfigFromZodSchema(schema, "recordField");

      expect(field).toStrictEqual<Map<string, SettingFieldProps>>(
        new Map([
          [
            "recordField",
            {
              type: "dictionary",
              config: {
                label: "Record Field",
                name: "recordField",
                itemFields: [
                  {
                    type: "text",
                    config: {
                      label: "Value",
                      name: "recordField.value",
                      registerOptions: {
                        required: true,
                        setValueAs: expect.any(Function),
                      },
                    },
                  },
                ],
                keyLabel: "Value Title",
              },
            },
          ],
        ]),
      );
    });

    it("unwraps optional schemas correctly", () => {
      const schema = z
        .record(z.string(), z.string())
        .meta({ title: "Optional Record Field" })
        .optional();

      const field = buildSettingsConfigFromZodSchema(
        schema,
        "optionalRecordField",
      );

      expect(field).toStrictEqual<Map<string, SettingFieldProps>>(
        new Map([
          [
            "optionalRecordField",
            {
              type: "dictionary",
              config: {
                label: "Optional Record Field",
                name: "optionalRecordField",
                itemFields: [
                  {
                    type: "text",
                    config: {
                      label: "Value",
                      name: "optionalRecordField.value",
                      registerOptions: {
                        required: false,
                        setValueAs: expect.any(Function),
                      },
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

  describe("record schemas with non-string keys", () => {
    it("skips them", () => {
      const schema = z.record(z.enum(["a", "b"]), z.string());

      const field = buildSettingsConfigFromZodSchema(schema, "recordField");

      expect(field).toStrictEqual(new Map());
    });
  });

  describe("string schemas", () => {
    it('returns a "text" field when "meta().secret" is falsy', () => {
      const schema = z.string().meta({ title: "Text Field" });

      const field = buildSettingsConfigFromZodSchema(schema, "textField");

      expect(field).toStrictEqual<Map<string, SettingFieldProps>>(
        new Map([
          [
            "textField",
            {
              type: "text",
              config: {
                label: "Text Field",
                name: "textField",
                registerOptions: {
                  required: true,
                  setValueAs: expect.any(Function),
                },
              },
            },
          ],
        ]),
      );
    });

    it('returns a "secret" field when "meta().secret" is true', () => {
      const schema = z.string().meta({ title: "Secret Field", secret: true });

      const field = buildSettingsConfigFromZodSchema(schema, "secretField");

      expect(field).toStrictEqual<Map<string, SettingFieldProps>>(
        new Map([
          [
            "secretField",
            {
              type: "secret",
              config: {
                label: "Secret Field",
                name: "secretField",
                registerOptions: { required: true },
              },
            },
          ],
        ]),
      );
    });

    it("sets the secret state and reset handler from the context", () => {
      const schema = z.string().meta({ title: "API Key", secret: true });
      const onResetSecret = vi.fn<(path: string) => void>();

      const field = buildSettingsConfigFromZodSchema(
        schema,
        "apiKey",
        true,
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

      const fields = buildSettingsConfigFromZodSchema(
        schema,
        undefined,
        true,
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

    it("sets size constraints if provided on the schema", () => {
      const schema = z
        .string()
        .min(5)
        .max(10)
        .meta({ title: "Sized Text Field" });

      const field = buildSettingsConfigFromZodSchema(schema, "sizedTextField");

      expect(field).toStrictEqual<Map<string, SettingFieldProps>>(
        new Map([
          [
            "sizedTextField",
            {
              type: "text",
              config: {
                label: "Sized Text Field",
                name: "sizedTextField",
                registerOptions: {
                  required: true,
                  minLength: 5,
                  maxLength: 10,
                  setValueAs: expect.any(Function),
                },
              },
            },
          ],
        ]),
      );
    });

    it("unwraps optional schemas correctly", () => {
      const schema = z
        .string()
        .meta({ title: "Optional Text Field" })
        .optional();
      const field = buildSettingsConfigFromZodSchema(
        schema,
        "optionalTextField",
      );

      expect(field).toStrictEqual<Map<string, SettingFieldProps>>(
        new Map([
          [
            "optionalTextField",
            {
              type: "text",
              config: {
                label: "Optional Text Field",
                name: "optionalTextField",
                registerOptions: {
                  required: false,
                  setValueAs: expect.any(Function),
                },
              },
            },
          ],
        ]),
      );
    });
  });

  describe("text input values", () => {
    const getSetValueAs = (schema: z.ZodType) => {
      const [field] = buildSettingsConfigFromZodSchema(
        schema,
        "textField",
      ).values();

      if (field?.type !== "text") {
        throw new Error("Expected a text field");
      }

      return field.config.registerOptions?.setValueAs;
    };

    it.each([
      ["an optional", z.string().optional()],
      ["a defaulted", z.string().default("./logs")],
      ["a required", z.string()],
    ])("leaves an emptied input as undefined for %s string", (_, schema) => {
      expect(getSetValueAs(schema)?.("")).toBeUndefined();
    });

    it.each([
      ["a nullable", z.string().nullable()],
      ["a served nullable", z.union([z.string(), z.null()]).default("x")],
    ])("leaves an emptied input as null for %s string", (_, schema) => {
      expect(getSetValueAs(schema)?.("")).toBeNull();
    });

    it("keeps a typed value", () => {
      expect(getSetValueAs(z.string().optional())?.("/var/log")).toBe(
        "/var/log",
      );
    });

    it("keeps an emptied secret as blank, which leaves it unchanged", () => {
      const [field] = buildSettingsConfigFromZodSchema(
        z.string().optional().meta({ secret: true }),
        "secretField",
      ).values();

      expect(field?.type).toBe("secret");
      expect(field?.config).not.toHaveProperty("registerOptions.setValueAs");
    });
  });

  describe("enum schemas", () => {
    it('returns a "select" field for a string enum schema', () => {
      const schema = z
        .enum(["option-1", "option-2", "option-3"])
        .meta({ title: "Enum Field" });

      const field = buildSettingsConfigFromZodSchema(schema, "enumField");

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
                registerOptions: { required: true },
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

      const field = buildSettingsConfigFromZodSchema(schema, "enumField");

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
                registerOptions: { required: true },
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

      const field = buildSettingsConfigFromZodSchema(
        schema,
        "optionalEnumField",
      );

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
                registerOptions: { required: false },
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

      const field = buildSettingsConfigFromZodSchema(
        schema,
        "stringArrayField",
      );

      expect(field).toStrictEqual<Map<string, SettingFieldProps>>(
        new Map([
          [
            "stringArrayField",
            {
              type: "string_array",
              config: {
                label: "String Array Field",
                name: "stringArrayField",
                registerOptions: { required: true },
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

      const field = buildSettingsConfigFromZodSchema(schema, "enumArrayField");

      expect(field).toStrictEqual<Map<string, SettingFieldProps>>(
        new Map([
          [
            "enumArrayField",
            {
              type: "string_array",
              config: {
                label: "Enum Array Field",
                name: "enumArrayField",
                registerOptions: { required: true },
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
      const field = buildSettingsConfigFromZodSchema(schema, "unsupported");

      expect(field).toStrictEqual(new Map());
    });

    it("skips an unsupported array without affecting its siblings", () => {
      const schema = z.object({
        urls: z.array(z.union([z.url(), z.email()])),
        name: z.string(),
      });

      const field = buildSettingsConfigFromZodSchema(schema);

      expect([...field.keys()]).toStrictEqual(["name"]);
    });

    it("unwraps optional schemas correctly", () => {
      const schema = z
        .string()
        .array()
        .meta({ title: "Optional String Array Field" })
        .optional();

      const field = buildSettingsConfigFromZodSchema(
        schema,
        "optionalStringArrayField",
      );

      expect(field).toStrictEqual<Map<string, SettingFieldProps>>(
        new Map([
          [
            "optionalStringArrayField",
            {
              type: "string_array",
              config: {
                label: "Optional String Array Field",
                name: "optionalStringArrayField",
                registerOptions: { required: false },
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

      const field = buildSettingsConfigFromZodSchema(schema);

      expect(field).toStrictEqual<Map<string, SettingFieldProps>>(
        new Map([
          [
            "field1",
            {
              type: "text",
              config: {
                label: "Field 1",
                name: "field1",
                registerOptions: {
                  required: true,
                  setValueAs: expect.any(Function),
                },
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
                registerOptions: {
                  required: true,
                  setValueAs: expect.any(Function),
                },
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
                registerOptions: { required: true },
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

      const field = buildSettingsConfigFromZodSchema(schema);

      expect(field).toStrictEqual<Map<string, SettingFieldProps>>(
        new Map([
          [
            "require",
            {
              type: "string_array",
              config: {
                label: "Require",
                name: "require",
                registerOptions: { required: true },
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
                      registerOptions: { required: true },
                    },
                  },
                  {
                    type: "boolean",
                    config: {
                      label: "R1080p",
                      name: "resolutions.r1080p",
                      registerOptions: { required: true },
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
      const schema = z
        .tuple([z.int(), z.string(), z.int()])
        .meta({ title: "T" });

      const field = buildSettingsConfigFromZodSchema(schema, "t");

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
                      registerOptions: {
                        required: true,
                        max: Number.MAX_SAFE_INTEGER,
                        min: Number.MIN_SAFE_INTEGER,
                        setValueAs: expect.any(Function),
                      },
                      step: 1,
                    },
                  },
                  {
                    type: "text",
                    config: {
                      label: "T 2",
                      name: "t.1",
                      registerOptions: {
                        required: true,
                        setValueAs: expect.any(Function),
                      },
                    },
                  },
                  {
                    type: "number",
                    config: {
                      label: "T 3",
                      name: "t.2",
                      registerOptions: {
                        required: true,
                        max: Number.MAX_SAFE_INTEGER,
                        min: Number.MIN_SAFE_INTEGER,
                        setValueAs: expect.any(Function),
                      },
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

    it("carries element constraints over to the item fields", () => {
      const schema = z.tuple([z.int().min(1).max(5)]);

      const field = buildSettingsConfigFromZodSchema(schema, "t");
      const [tuple] = field.values();

      expect(tuple).toMatchObject({
        type: "tuple",
        config: {
          itemFields: [{ config: { registerOptions: { min: 1, max: 5 } } }],
        },
      });
    });

    it("marks defaulted elements as not required", () => {
      const schema = z.tuple([z.int().default(2)]);

      const field = buildSettingsConfigFromZodSchema(schema, "t");
      const [tuple] = field.values();

      expect(tuple).toMatchObject({
        config: {
          itemFields: [{ config: { registerOptions: { required: false } } }],
        },
      });
    });

    it("uses an element's title as its item label", () => {
      const schema = z.tuple([z.int().meta({ title: "After 2 attempts" })]);

      const field = buildSettingsConfigFromZodSchema(schema, "t");
      const [tuple] = field.values();

      expect(tuple).toMatchObject({
        config: { itemFields: [{ config: { label: "After 2 attempts" } }] },
      });
    });

    it("skips tuples with a rest element", () => {
      const schema = z.tuple([z.int()]).rest(z.int());

      const field = buildSettingsConfigFromZodSchema(schema, "t");

      expect(field).toStrictEqual(new Map());
    });
  });

  describe("labels", () => {
    it("prefers the title", () => {
      const [field] = buildSettingsConfigFromZodSchema(
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
      const [field] = buildSettingsConfigFromZodSchema(
        z.string(),
        key,
      ).values();

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

      const field = buildSettingsConfigFromZodSchema(
        schema,
        "defaultStringField",
      );

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
                registerOptions: {
                  required: false,
                  setValueAs: expect.any(Function),
                },
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

      const field = buildSettingsConfigFromZodSchema(schema, "numberField");

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
                registerOptions: {
                  required: false,
                  setValueAs: expect.any(Function),
                },
                step: 0.01,
              },
            },
          ],
        ]),
      );
    });
  });
});
