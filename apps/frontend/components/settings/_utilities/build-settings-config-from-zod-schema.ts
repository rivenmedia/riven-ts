import { ZodString, ZodType } from "zod";

import type {
  CommonSettingFieldProps,
  SettingFieldProps,
} from "../setting-field/setting-field";
import type {
  ZodArray,
  ZodEnum,
  ZodNumber,
  ZodOptional,
  ZodRecord,
  ZodObject,
  ZodDefault,
} from "zod";
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

export function buildSettingsConfigFromZodSchema(
  schema: $ZodType,
  key?: string,
  required = true,
) {
  const settings = new Map<string, SettingFieldProps>();
  const meta = getSchemaMetadata(schema);

  switch (schema._zod.def.type) {
    case "string": {
      const commonConfig = buildCommonConfig(schema, key);

      if (meta.secret) {
        return settings.set(commonConfig.name, {
          type: "secret",
          config: {
            ...commonConfig,
            registerOptions: { required },
          },
        });
      }

      return settings.set(commonConfig.name, {
        type: "text",
        config: {
          ...commonConfig,
          registerOptions: {
            required,
          },
        },
      });
    }
    case "boolean": {
      const commonConfig = buildCommonConfig(schema, key);

      if (!required) {
        return settings.set(commonConfig.name, {
          type: "nullable_boolean",
          config: {
            ...commonConfig,
            registerOptions: { required: true },
          },
        });
      }

      return settings.set(commonConfig.name, {
        type: "boolean",
        config: {
          ...commonConfig,
          registerOptions: { required: true },
        },
      });
    }
    case "int":
    case "number": {
      const commonConfig = buildCommonConfig(schema, key);

      const { minValue, maxValue, format } = schema as ZodNumber;
      const hasMinConstraint = minValue && Number.isFinite(minValue);
      const hasMaxConstraint = maxValue && Number.isFinite(maxValue);

      const isInt = format === "safeint";

      return settings.set(commonConfig.name, {
        type: "number",
        config: {
          ...commonConfig,
          registerOptions: {
            ...(hasMinConstraint ? { min: minValue } : {}),
            ...(hasMaxConstraint ? { max: maxValue } : {}),
            required,
          },
          step: isInt ? 1 : 0.01,
        },
      });
    }
    case "enum": {
      const commonConfig = buildCommonConfig(schema, key);
      const { enum: enumValues } = schema as ZodEnum;

      return settings.set(commonConfig.name, {
        type: "select",
        config: {
          ...commonConfig,
          registerOptions: { required },
          options: Object.entries(enumValues).map(([enumKey, enumValue]) => ({
            value: enumValue.toString(),
            label: enumKey,
          })),
        },
      });
    }
    case "array": {
      const commonConfig = buildCommonConfig(schema, key);
      const { element } = schema as ZodArray;

      if (element instanceof ZodString) {
        return settings.set(commonConfig.name, {
          type: "string_array",
          config: {
            ...commonConfig,
            registerOptions: { required },
          },
        });
      }

      return settings;
    }
    case "record": {
      const commonConfig = buildCommonConfig(schema, key);
      const { keyType, valueType } = schema as ZodRecord;

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
      const nestedSettings = new Map<string, SettingFieldProps>();

      const { shape } = schema as ZodObject<Record<string, ZodType>>;

      for (const [fieldKey, fieldSchema] of Object.entries(shape)) {
        const setting = buildSettingsConfigFromZodSchema(
          fieldSchema,
          [key, fieldKey].filter(Boolean).join("."),
          required,
        );

        for (const [nestedKey, nestedSetting] of setting) {
          nestedSettings.set(nestedKey, nestedSetting);
        }
      }

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

      for (const [nestedKey, nestedSetting] of nestedSettings) {
        settings.set(nestedKey, nestedSetting);
      }

      return settings;
    }
    case "default": {
      const innerSchema = (schema as ZodDefault).unwrap();

      return buildSettingsConfigFromZodSchema(innerSchema, key, required);
    }
    case "optional":
    case "nullable": {
      const innerSchema = (schema as ZodOptional).unwrap();

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
