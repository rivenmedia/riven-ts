import { SettingField } from "../setting-field/setting-field";

import type { SettingFieldProps } from "../setting-field/setting-field";

export interface SettingGroupProps {
  title: string;
  schema: readonly [SettingFieldProps, ...SettingFieldProps[]];
}

export function SettingGroup({ title, schema }: SettingGroupProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      {schema.map((fieldProps) => (
        <div key={fieldProps.config.name}>
          <SettingField {...fieldProps} />
        </div>
      ))}
    </div>
  );
}
