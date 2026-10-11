import { cn } from "cn";

import { SettingsBooleanField } from "./_components/boolean-field.tsx";
import { SettingsCustomRankField } from "./_components/custom-rank-field.tsx";
import { SettingsDictionaryField } from "./_components/dictionary-field.tsx";
import { SettingsNullableBooleanField } from "./_components/nullable-boolean-field.tsx";
import { SettingsNumberField } from "./_components/number-field.tsx";
import { SettingsSecretField } from "./_components/secret-field.tsx";
import { SettingsSelectField } from "./_components/select-field.tsx";
import { SettingGroup } from "./_components/setting-group.tsx";
import { SettingsStringArrayField } from "./_components/string-array-field.tsx";
import { SettingsTextField } from "./_components/text-field.tsx";

import type { ComponentProps, ComponentType } from "react";

export interface CommonSettingFieldProps {
  name: string;
  label: string;
  description?: string;
}

type SettingsFieldType =
  | "group"
  | "text"
  | "secret"
  | "number"
  | "boolean"
  | "nullable_boolean"
  | "select"
  | "string_array"
  | "custom_rank"
  | "dictionary";

const settingFieldComponents = {
  group: SettingGroup,
  text: SettingsTextField,
  secret: SettingsSecretField,
  number: SettingsNumberField,
  boolean: SettingsBooleanField,
  nullable_boolean: SettingsNullableBooleanField,
  select: SettingsSelectField,
  string_array: SettingsStringArrayField,
  custom_rank: SettingsCustomRankField,
  dictionary: SettingsDictionaryField,
} as const satisfies Record<SettingsFieldType, React.ComponentType<never>>;

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

export function SettingField({
  type,
  config,
  nested = false,
  parentName,
}: SettingFieldProps) {
  const name =
    nested && parentName ? `${parentName}.${config.name}` : config.name;

  // oxlint-disable-next-line typescript/no-explicit-any
  const Component: ComponentType<any> = settingFieldComponents[type];

  return (
    <div className={cn("space-y-3", !nested && "rounded-lg border p-4")}>
      <Component {...config} name={name} />
    </div>
  );
}
