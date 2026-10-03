import {
  ZodArray,
  ZodString,
  ZodType,
  ZodEnum,
  ZodNumber,
  ZodObject,
  ZodRecord,
  ZodDefault,
  ZodOptional,
  ZodNullable,
  ZodBoolean,
} from "zod";

import type {
  CommonSettingFieldProps,
  SettingFieldProps,
} from "../setting-field/setting-field";
import type { Constructor } from "type-fest";
import type { $ZodType } from "zod/v4/core";

function getSchemaMetadata(schema: $ZodType) {
  if (schema instanceof ZodType) {
    return schema.meta() ?? {};
  }

  return {};
}

function buildCommonConfig(
  schema: $ZodType,
  key?: string,
): CommonSettingFieldProps {
  if (!key) {
    throw new Error("A key must be provided for non-object schemas");
  }

  const meta = getSchemaMetadata(schema);

  return {
    label: meta.title ?? key,
    name: key,
    ...(meta.description && { description: meta.description }),
  };
}

type SettingEntry = [name: string, setting: SettingFieldProps];

function assertSchemaType<T extends $ZodType>(
  schema: $ZodType,
  expectedType: Constructor<T>,
): asserts schema is T {
  if (!(schema instanceof expectedType)) {
    throw new Error(
      `Expected a ${expectedType.name} schema, got ${schema.constructor.name}`,
    );
  }
}

function buildStringSetting(
  schema: ZodString,
  key: string | undefined,
  required: boolean,
): SettingEntry {
  const { minLength, maxLength } = schema;
  const commonConfig = buildCommonConfig(schema, key);

  if (getSchemaMetadata(schema).secret) {
    return [
      commonConfig.name,
      {
        type: "secret",
        config: {
          ...commonConfig,
          registerOptions: { required },
        },
      },
    ];
  }

  return [
    commonConfig.name,
    {
      type: "text",
      config: {
        ...commonConfig,
        registerOptions: {
          ...(minLength == null ? {} : { minLength }),
          ...(maxLength == null ? {} : { maxLength }),
          required,
        },
      },
    },
  ];
}

function buildBooleanSetting(
  schema: ZodBoolean,
  key: string | undefined,
  required: boolean,
): SettingEntry {
  const commonConfig = buildCommonConfig(schema, key);

  if (!required) {
    return [
      commonConfig.name,
      {
        type: "nullable_boolean",
        config: {
          ...commonConfig,
          registerOptions: { required: true },
        },
      },
    ];
  }

  return [
    commonConfig.name,
    {
      type: "boolean",
      config: {
        ...commonConfig,
        registerOptions: { required: true },
      },
    },
  ];
}

function buildEnumSetting(
  schema: ZodEnum,
  key: string | undefined,
  required: boolean,
): SettingEntry {
  const commonConfig = buildCommonConfig(schema, key);
  const { enum: enumValues } = schema;

  return [
    commonConfig.name,
    {
      type: "select",
      config: {
        ...commonConfig,
        registerOptions: { required },
        options: Object.entries(enumValues).map(([enumKey, enumValue]) => ({
          value: enumValue.toString(),
          label: enumKey,
        })),
      },
    },
  ];
}

function buildArraySetting(
  schema: ZodArray,
  key: string | undefined,
  required: boolean,
): SettingEntry {
  const commonConfig = buildCommonConfig(schema, key);
  const { element } = schema;

  if (element instanceof ZodString) {
    return [
      commonConfig.name,
      {
        type: "string_array",
        config: {
          ...commonConfig,
          registerOptions: { required },
        },
      },
    ];
  }

  throw new Error(`Unsupported array element type: ${element._zod.def.type}`);
}

function getNumberStep(multipleOf: unknown, isInt: boolean) {
  if (typeof multipleOf === "number" && Number.isFinite(multipleOf)) {
    return multipleOf;
  }

  return isInt ? 1 : 0.01;
}

function buildNumberSetting(
  schema: ZodNumber,
  key: string | undefined,
  required: boolean,
): SettingEntry {
  const commonConfig = buildCommonConfig(schema, key);

  const { minValue, maxValue, format, _zod } = schema;
  const hasMinConstraint = minValue != null && Number.isFinite(minValue);
  const hasMaxConstraint = maxValue != null && Number.isFinite(maxValue);

  const { multipleOf } = _zod.bag;

  return [
    commonConfig.name,
    {
      type: "number",
      config: {
        ...commonConfig,
        registerOptions: {
          ...(hasMinConstraint ? { min: minValue } : {}),
          ...(hasMaxConstraint ? { max: maxValue } : {}),
          required,
          valueAsNumber: true,
        },
        step: getNumberStep(multipleOf, format === "safeint"),
      },
    },
  ];
}

export function buildSettingsConfigFromZodSchema(
  schema: $ZodType,
  key?: string,
  required = true,
): Map<string, SettingFieldProps> {
  const settings = new Map<string, SettingFieldProps>();
  const meta = getSchemaMetadata(schema);

  switch (schema._zod.def.type) {
    case "string": {
      assertSchemaType(schema, ZodString);

      const [name, setting] = buildStringSetting(schema, key, required);

      return settings.set(name, setting);
    }
    case "boolean": {
      assertSchemaType(schema, ZodBoolean);

      const [name, setting] = buildBooleanSetting(schema, key, required);

      return settings.set(name, setting);
    }
    case "int":
    case "number": {
      assertSchemaType(schema, ZodNumber);

      const [name, setting] = buildNumberSetting(schema, key, required);

      return settings.set(name, setting);
    }
    case "enum": {
      assertSchemaType(schema, ZodEnum);

      const [name, setting] = buildEnumSetting(schema, key, required);

      return settings.set(name, setting);
    }
    case "array": {
      assertSchemaType(schema, ZodArray);

      const [name, setting] = buildArraySetting(schema, key, required);

      return settings.set(name, setting);
    }
    case "record": {
      assertSchemaType(schema, ZodRecord);

      const commonConfig = buildCommonConfig(schema, key);
      const { keyType, valueType } = schema;

      if (!(keyType instanceof ZodString)) {
        throw new Error("Only string keys are supported for record schemas");
      }

      const { title: keyTitle } = keyType.meta() ?? {};

      const itemFields: SettingFieldProps[] = [
        ...buildSettingsConfigFromZodSchema(
          valueType,
          `${commonConfig.name}.value`,
          required,
        ).values(),
      ];

      return settings.set(commonConfig.name, {
        type: "dictionary",
        config: {
          ...commonConfig,
          itemFields,
          ...(keyTitle && { keyLabel: keyTitle }),
        },
      });
    }
    case "object": {
      assertSchemaType(schema, ZodObject);

      const { shape } = schema as ZodObject<Record<string, ZodType>>;

      const nestedSettings = new Map<string, SettingFieldProps>(
        Object.entries(shape).flatMap(([fieldKey, fieldSchema]) =>
          buildSettingsConfigFromZodSchema(
            fieldSchema,
            [key, fieldKey].filter(Boolean).join("."),
            required,
          )
            .entries()
            .toArray(),
        ),
      );

      // A key means this object is nested within a parent schema, so it's
      // rendered as its own group rather than flattened into the parent.
      if (key) {
        return settings.set(key, {
          type: "group",
          config: {
            name: meta.title ?? key,
            ...(meta.description && { description: meta.description }),
            schema: [...nestedSettings.values()],
          },
        });
      }

      return nestedSettings;
    }
    case "default": {
      assertSchemaType(schema, ZodDefault);

      const innerSchema = schema.unwrap();

      return buildSettingsConfigFromZodSchema(innerSchema, key, required);
    }
    case "optional": {
      assertSchemaType(schema, ZodOptional);

      const innerSchema = schema.unwrap();

      return buildSettingsConfigFromZodSchema(innerSchema, key, false);
    }
    case "nullable": {
      assertSchemaType(schema, ZodNullable);

      const innerSchema = schema.unwrap();

      return buildSettingsConfigFromZodSchema(innerSchema, key, false);
    }
    case "any":
    case "bigint":
    case "catch":
    case "custom":
    case "date":
    case "function":
    case "lazy":
    case "literal":
    case "map":
    case "nan":
    case "never":
    case "null":
    case "promise":
    case "set":
    case "symbol":
    case "tuple":
    case "undefined":
    case "union":
    case "unknown":
    case "file":
    case "intersection":
    case "nonoptional":
    case "pipe":
    case "prefault":
    case "readonly":
    case "success":
    case "template_literal":
    case "transform":
    case "void": {
      return settings;
    }
  }
}
