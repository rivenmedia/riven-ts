import {
  ZodArray,
  ZodString,
  ZodType,
  ZodEnum,
  ZodNumber,
  ZodObject,
  ZodRecord,
  ZodTuple,
  ZodDefault,
  ZodOptional,
  ZodNullable,
  ZodBoolean,
  z,
} from "zod";

import type {
  CommonSettingFieldProps,
  SecretState,
  SettingFieldProps,
} from "#components/settings/setting-field/setting-field.tsx";
import type { Constructor } from "type-fest";
import type { GlobalMeta } from "zod";
import type { $ZodType } from "zod/v4/core";

function getSchemaMetadata(schema: $ZodType): GlobalMeta {
  if (schema instanceof ZodType) {
    return schema.meta() ?? {};
  }

  return {};
}

export interface BuildSettingsContext {
  lockedFields?: ReadonlySet<string>;
  secretStates?: ReadonlyMap<string, SecretState>;
  onResetSecret?: (path: string) => void;
}

function buildCommonConfig(
  meta: GlobalMeta,
  key?: string,
  context?: BuildSettingsContext,
): CommonSettingFieldProps {
  if (!key) {
    throw new Error("A key must be provided for non-object schemas");
  }

  return {
    label: meta.title ?? key,
    name: key,
    ...(meta.description && { description: meta.description }),
    ...(context?.lockedFields?.has(key) && { locked: true }),
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
  meta: GlobalMeta,
  context?: BuildSettingsContext,
): SettingEntry {
  const { minLength, maxLength } = schema;
  const commonConfig = buildCommonConfig(meta, key, context);

  if (meta.secret) {
    const secretState = context?.secretStates?.get(commonConfig.name);
    const { onResetSecret } = context ?? {};

    return [
      commonConfig.name,
      {
        type: "secret",
        config: {
          ...commonConfig,
          registerOptions: { required },
          ...(secretState && { secretState }),
          ...(onResetSecret && {
            onReset: () => {
              onResetSecret(commonConfig.name);
            },
          }),
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
  key: string | undefined,
  required: boolean,
  meta: GlobalMeta,
  context?: BuildSettingsContext,
): SettingEntry {
  const commonConfig = buildCommonConfig(meta, key, context);

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
  meta: GlobalMeta,
  context?: BuildSettingsContext,
): SettingEntry {
  const commonConfig = buildCommonConfig(meta, key, context);
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
  meta: GlobalMeta,
  context?: BuildSettingsContext,
): SettingEntry {
  const commonConfig = buildCommonConfig(meta, key, context);
  const { element } = schema;

  if (element instanceof ZodString || element instanceof ZodEnum) {
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
  meta: GlobalMeta,
  context?: BuildSettingsContext,
): SettingEntry {
  const commonConfig = buildCommonConfig(meta, key, context);

  const { multipleOf, minimum, maximum, type } = z.toJSONSchema(schema);
  const hasMinConstraint = minimum != null && Number.isFinite(minimum);
  const hasMaxConstraint = maximum != null && Number.isFinite(maximum);

  return [
    commonConfig.name,
    {
      type: "number",
      config: {
        ...commonConfig,
        registerOptions: {
          ...(hasMinConstraint ? { min: minimum } : {}),
          ...(hasMaxConstraint ? { max: maximum } : {}),
          required,
          valueAsNumber: true,
        },
        step: getNumberStep(multipleOf, type === "integer"),
      },
    },
  ];
}

export function buildSettingsConfigFromZodSchema(
  schema: $ZodType,
  key?: string,
  required = true,
  wrapperMeta: GlobalMeta = {},
  context?: BuildSettingsContext,
): Map<string, SettingFieldProps> {
  const settings = new Map<string, SettingFieldProps>();
  const meta = { ...getSchemaMetadata(schema), ...wrapperMeta };

  switch (schema._zod.def.type) {
    case "string": {
      assertSchemaType(schema, ZodString);

      const [name, setting] = buildStringSetting(
        schema,
        key,
        required,
        meta,
        context,
      );

      return settings.set(name, setting);
    }
    case "boolean": {
      assertSchemaType(schema, ZodBoolean);

      const [name, setting] = buildBooleanSetting(key, required, meta, context);

      return settings.set(name, setting);
    }
    case "int":
    case "number": {
      assertSchemaType(schema, ZodNumber);

      const [name, setting] = buildNumberSetting(
        schema,
        key,
        required,
        meta,
        context,
      );

      return settings.set(name, setting);
    }
    case "enum": {
      assertSchemaType(schema, ZodEnum);

      const [name, setting] = buildEnumSetting(
        schema,
        key,
        required,
        meta,
        context,
      );

      return settings.set(name, setting);
    }
    case "array": {
      assertSchemaType(schema, ZodArray);

      const [name, setting] = buildArraySetting(
        schema,
        key,
        required,
        meta,
        context,
      );

      return settings.set(name, setting);
    }
    case "record": {
      assertSchemaType(schema, ZodRecord);

      const commonConfig = buildCommonConfig(meta, key, context);
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
          {},
          context,
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
    case "tuple": {
      assertSchemaType(schema, ZodTuple);

      if (schema.def.rest) {
        throw new Error(`Tuple rest elements are not supported`);
      }

      const commonConfig = buildCommonConfig(meta, key, context);

      const itemFields = schema.def.items.flatMap((element, index) => {
        const itemName = `${commonConfig.name}.${index.toString()}`;

        return buildSettingsConfigFromZodSchema(
          element,
          itemName,
          required,
          {},
          context,
        )
          .values()
          .map((itemField) => {
            // An untitled element falls back to its key as the label, so
            // replace that with a positional label.
            if (
              "label" in itemField.config &&
              itemField.config.label === itemName
            ) {
              itemField.config.label = `${commonConfig.label} ${(index + 1).toString()}`;
            }

            return itemField;
          })
          .toArray();
      });

      return settings.set(commonConfig.name, {
        type: "tuple",
        config: { ...commonConfig, itemFields },
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
            {},
            context,
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

      return buildSettingsConfigFromZodSchema(
        innerSchema,
        key,
        false,
        meta,
        context,
      );
    }
    case "optional": {
      assertSchemaType(schema, ZodOptional);

      const innerSchema = schema.unwrap();

      return buildSettingsConfigFromZodSchema(
        innerSchema,
        key,
        false,
        meta,
        context,
      );
    }
    case "nullable": {
      assertSchemaType(schema, ZodNullable);

      const innerSchema = schema.unwrap();

      return buildSettingsConfigFromZodSchema(
        innerSchema,
        key,
        false,
        meta,
        context,
      );
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
