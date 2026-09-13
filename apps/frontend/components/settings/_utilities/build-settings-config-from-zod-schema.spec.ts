import { it, expect, describe } from "vitest";
import { z } from "zod";

import { buildSettingsConfigFromZodSchema } from "./build-settings-config-from-zod-schema";

import type { SettingFieldProps } from "../setting-field/setting-field";

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
                },
                step: 1,
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
                registerOptions: { required: false },
                step: 0.01,
              },
            },
          ],
        ]),
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
                      label: "recordField.value",
                      name: "recordField.value",
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
                      label: "recordField.value",
                      name: "recordField.value",
                      registerOptions: { required: true },
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
                      label: "optionalRecordField.value",
                      name: "optionalRecordField.value",
                      registerOptions: { required: false },
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
                registerOptions: { required: true },
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
                registerOptions: { required: false },
              },
            },
          ],
        ]),
      );
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
                registerOptions: { required: true },
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
                registerOptions: { required: true },
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
                label: "require",
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
                      label: "resolutions.r2160p",
                      name: "resolutions.r2160p",
                      registerOptions: { required: true },
                    },
                  },
                  {
                    type: "boolean",
                    config: {
                      label: "resolutions.r1080p",
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

  describe("default schemas", () => {
    it("unwraps the inner type correctly", () => {
      const schema = z
        .string()
        .meta({ title: "Default String Field" })
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
                name: "defaultStringField",
                registerOptions: { required: true },
              },
            },
          ],
        ]),
      );
    });
  });
});
