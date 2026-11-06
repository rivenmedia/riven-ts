import { cn } from "cn";

import { SettingsBooleanField } from "./_components/boolean-field.tsx";
import { SettingsCustomRankField } from "./_components/custom-rank-field.tsx";
import { SettingsDictionaryField } from "./_components/dictionary-field.tsx";
import { SettingsNullableBooleanField } from "./_components/nullable-boolean-field.tsx";
import { SettingsNumberField } from "./_components/number-field.tsx";
import { SettingsPasswordField } from "./_components/password-field.tsx";
import { SettingsSecretField } from "./_components/secret-field.tsx";
import { SettingsSelectField } from "./_components/select-field.tsx";
import { SettingFieldError } from "./_components/setting-field-error.tsx";
import { SettingGroup } from "./_components/setting-group.tsx";
import { SettingsStringArrayField } from "./_components/string-array-field.tsx";
import { SettingsTextField } from "./_components/text-field.tsx";
import { SettingsTupleField } from "./_components/tuple-field.tsx";

import type { ComponentProps, ComponentType } from "react";

export interface CommonSettingFieldProps {
  name: string;
  label: string;
  description?: string;
  locked?: boolean;
}

const settingFieldComponents = {
  group: SettingGroup,
  text: SettingsTextField,
  password: SettingsPasswordField,
  secret: SettingsSecretField,
  number: SettingsNumberField,
  boolean: SettingsBooleanField,
  nullable_boolean: SettingsNullableBooleanField,
  select: SettingsSelectField,
  string_array: SettingsStringArrayField,
  custom_rank: SettingsCustomRankField,
  dictionary: SettingsDictionaryField,
  tuple: SettingsTupleField,
} as const satisfies Record<string, React.ComponentType<never>>;

type SettingsFieldType = keyof typeof settingFieldComponents;

export type SettingFieldProps = (
  | { nested?: false; parentName?: never }
  | { nested: true; parentName: string }
) &
  {
    [T in SettingsFieldType]: {
      type: T;
      config: ComponentProps<(typeof settingFieldComponents)[T]>;
    };
  }[SettingsFieldType];

/**
 * Renders the right input for a schema-driven setting (text, secret, number,
 * boolean, select, array, rank, dictionary, tuple or group).
 */
export function SettingField({
  type,
  config: { locked = false, ...config },
  nested = false,
  parentName,
}: SettingFieldProps) {
  const name =
    nested && parentName ? `${parentName}.${config.name}` : config.name;

  // oxlint-disable-next-line typescript/no-explicit-any
  const Component: ComponentType<any> = settingFieldComponents[type];

  return (
    <div className={cn("space-y-3", !nested && "rounded-lg border p-4")}>
      {locked ? (
        <fieldset disabled className="space-y-3">
          <Component {...config} name={name} />
          <p className="text-muted-foreground text-sm">
            Set by environment variable
          </p>
        </fieldset>
      ) : (
        <Component {...config} name={name} />
      )}
      {type !== "group" && <SettingFieldError name={name} />}
    </div>
  );
}
