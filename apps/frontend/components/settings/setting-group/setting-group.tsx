import { SettingField } from "../setting-field/setting-field";

import type { SettingFieldProps } from "../setting-field/setting-field";

export interface SettingGroupProps {
  title: string;
  description?: string;
  schema: Map<string, SettingFieldProps>;
}

export function SettingGroup({
  title,
  description,
  schema,
}: SettingGroupProps) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {[...schema.values()].map((fieldProps) => (
        <div key={fieldProps.config.name}>
          <SettingField {...fieldProps} />
        </div>
      ))}
    </div>
  );
}
