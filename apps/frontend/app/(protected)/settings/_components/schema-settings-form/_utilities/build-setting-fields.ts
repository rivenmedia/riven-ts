import { upperFirst } from "es-toolkit";
import {
  ZodArray,
  ZodString,
  ZodType,
  ZodEnum,
  ZodNumber,
  ZodObject,
  ZodTuple,
  ZodDefault,
  ZodOptional,
  ZodNullable,
  ZodBoolean,
  ZodUnion,
  z,
} from "zod";

import type { SecretState } from "#app/_types/__generated__/graphql.ts";
import type {
  CommonSettingFieldProps,
  SettingFieldProps,
} from "../_components/setting-field/setting-field.tsx";
import type { Constructor } from "type-fest";
import type { GlobalMeta } from "zod";
import type { $ZodType } from "zod/v4/core";

function getSchemaMetadata(schema: $ZodType): GlobalMeta {
  if (schema instanceof ZodType) {
    return schema.meta() ?? {};
  }

  return {};
}

export interface BuildSettingFieldsContext {
  lockedFields?: ReadonlySet<string>;
  secretStates?: ReadonlyMap<string, SecretState>;
  onResetSecret?: (path: string) => void;
}

/**
 * Turns an untitled field's key into a label, from its last path segment
 * (e.g. `scraping.dubbedAnimeOnly` becomes "Dubbed anime only").
 *
 * sentenceCase from es-toolkit isn't usable here
 * as it turns keys such as R2160p into "r 2160 p"
 */
function humaniseKey(key: string) {
  const segment = key.split(".").at(-1) ?? key;

  return upperFirst(
    segment.replaceAll(/(?<=[a-z\d])(?=[A-Z])/gu, " ").toLowerCase(),
  );
}

function buildCommonConfig(
  meta: GlobalMeta,
  key?: string,
  context?: BuildSettingFieldsContext,
): CommonSettingFieldProps {
  if (!key) {
    throw new Error("A key must be provided for non-object schemas");
  }

  return {
    label: meta.title ?? humaniseKey(key),
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
  key: string | undefined,
  nullable: boolean,
  meta: GlobalMeta,
  context?: BuildSettingFieldsContext,
): SettingEntry {
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
        ...(nullable && { nullable }),
      },
    },
  ];
}

function buildBooleanSetting(
  key: string | undefined,
  nullable: boolean,
  meta: GlobalMeta,
  context?: BuildSettingFieldsContext,
): SettingEntry {
  const commonConfig = buildCommonConfig(meta, key, context);

  return [
    commonConfig.name,
    nullable
      ? { type: "nullable_boolean", config: commonConfig }
      : { type: "boolean", config: commonConfig },
  ];
}

function buildEnumSetting(
  schema: ZodEnum,
  key: string | undefined,
  meta: GlobalMeta,
  context?: BuildSettingFieldsContext,
): SettingEntry {
  const commonConfig = buildCommonConfig(meta, key, context);
  const { enum: enumValues } = schema;

  return [
    commonConfig.name,
    {
      type: "select",
      config: {
        ...commonConfig,
        options: Object.entries(enumValues).map(([enumKey, enumValue]) => ({
          value: enumValue.toString(),
          label: enumKey,
        })),
      },
    },
  ];
}

/** Builds a string array field, or nothing for arrays of any other element type. */
function buildArraySetting(
  schema: ZodArray,
  key: string | undefined,
  meta: GlobalMeta,
  context?: BuildSettingFieldsContext,
): SettingEntry | undefined {
  const { element } = schema;

  if (!(element instanceof ZodString || element instanceof ZodEnum)) {
    return undefined;
  }

  const commonConfig = buildCommonConfig(meta, key, context);

  return [
    commonConfig.name,
    {
      type: "string_array",
      config: commonConfig,
    },
  ];
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
  nullable: boolean,
  meta: GlobalMeta,
  context?: BuildSettingFieldsContext,
): SettingEntry {
  const commonConfig = buildCommonConfig(meta, key, context);

  const { multipleOf, type } = z.toJSONSchema(schema);

  return [
    commonConfig.name,
    {
      type: "number",
      config: {
        ...commonConfig,
        ...(nullable && { nullable }),
        step: getNumberStep(multipleOf, type === "integer"),
      },
    },
  ];
}

/**
 * @param nullable Whether a `.nullable()` wrapper was unwrapped on the way to this schema, so `null` is a valid value.
 *   A default or optional wrapper doesn't set it.
 */
export function buildSettingFields(
  schema: $ZodType,
  key?: string,
  wrapperMeta: GlobalMeta = {},
  context?: BuildSettingFieldsContext,
  nullable = false,
): Map<string, SettingFieldProps> {
  const settings = new Map<string, SettingFieldProps>();
  const meta = { ...getSchemaMetadata(schema), ...wrapperMeta };

  switch (schema._zod.def.type) {
    case "string": {
      assertSchemaType(schema, ZodString);

      const [name, setting] = buildStringSetting(key, nullable, meta, context);

      return settings.set(name, setting);
    }
    case "boolean": {
      assertSchemaType(schema, ZodBoolean);

      const [name, setting] = buildBooleanSetting(key, nullable, meta, context);

      return settings.set(name, setting);
    }
    case "int":
    case "number": {
      assertSchemaType(schema, ZodNumber);

      const [name, setting] = buildNumberSetting(
        schema,
        key,
        nullable,
        meta,
        context,
      );

      return settings.set(name, setting);
    }
    case "enum": {
      assertSchemaType(schema, ZodEnum);

      const [name, setting] = buildEnumSetting(schema, key, meta, context);

      return settings.set(name, setting);
    }
    case "array": {
      assertSchemaType(schema, ZodArray);

      const entry = buildArraySetting(schema, key, meta, context);

      return entry ? settings.set(...entry) : settings;
    }
    case "tuple": {
      assertSchemaType(schema, ZodTuple);

      // A rest element has no fixed number of inputs, so it renders nothing
      if (schema.def.rest) {
        return settings;
      }

      const commonConfig = buildCommonConfig(meta, key, context);

      const itemFields = schema.def.items.flatMap((element, index) => {
        const itemName = `${commonConfig.name}.${index.toString()}`;

        return buildSettingFields(element, itemName, {}, context)
          .values()
          .map((itemField) => {
            // An untitled element falls back to its key as the label, so
            // replace that with a positional label.
            if (
              "label" in itemField.config &&
              itemField.config.label === humaniseKey(itemName)
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

      // A served `{ fetch, rank }` rank renders as one custom rank input
      if (meta["widget"] === "custom_rank") {
        const commonConfig = buildCommonConfig(meta, key, context);

        return settings.set(commonConfig.name, {
          type: "custom_rank",
          config: commonConfig,
        });
      }

      const { shape } = schema as ZodObject<Record<string, ZodType>>;

      const nestedSettings = new Map<string, SettingFieldProps>(
        Object.entries(shape).flatMap(([fieldKey, fieldSchema]) =>
          buildSettingFields(
            fieldSchema,
            [key, fieldKey].filter(Boolean).join("."),
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

      return buildSettingFields(innerSchema, key, meta, context, nullable);
    }
    case "optional": {
      assertSchemaType(schema, ZodOptional);

      const innerSchema = schema.unwrap();

      return buildSettingFields(innerSchema, key, meta, context, nullable);
    }
    case "nullable": {
      assertSchemaType(schema, ZodNullable);

      const innerSchema = schema.unwrap();

      return buildSettingFields(innerSchema, key, meta, context, true);
    }
    case "union": {
      assertSchemaType(schema, ZodUnion);

      // A served `.nullable()` comes back from JSON Schema as a union with
      // null, so it's built as the other member with null allowed
      const { options } = schema;
      const nonNullOptions = options.filter(
        (option) => option._zod.def.type !== "null",
      );
      const [innerSchema] = nonNullOptions;

      if (options.length !== 2 || nonNullOptions.length !== 1 || !innerSchema) {
        return settings;
      }

      return buildSettingFields(innerSchema, key, meta, context, true);
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
    case "record":
    case "set":
    case "symbol":
    case "undefined":
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
