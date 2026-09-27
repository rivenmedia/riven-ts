import { SettingField } from "../setting-field";

import type {
  CommonSettingFieldProps,
  SettingFieldProps,
} from "../setting-field";

export interface SettingGroupProps extends Omit<
  CommonSettingFieldProps,
  "label"
> {
  schema: SettingFieldProps[];
}

export function SettingGroup({ name, description, schema }: SettingGroupProps) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">{name}</h2>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {schema.map((fieldProps) => (
        <div key={fieldProps.config.name}>
          <SettingField {...fieldProps} />
        </div>
      ))}
    </div>
  );
}
