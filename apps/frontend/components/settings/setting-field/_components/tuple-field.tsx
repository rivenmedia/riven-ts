import { Label } from "#components/_ui/label.tsx";
import { SettingField } from "#components/settings/setting-field/setting-field.tsx";

import type {
  CommonSettingFieldProps,
  SettingFieldProps,
} from "#components/settings/setting-field/setting-field.tsx";

export interface SettingsTupleFieldProps extends CommonSettingFieldProps {
  itemFields: SettingFieldProps[];
}

export function SettingsTupleField({
  label,
  description,
  itemFields,
}: SettingsTupleFieldProps) {
  return (
    <>
      <div className="space-y-1">
        <Label className="text-base">{label}</Label>
        {description && (
          <p className="text-muted-foreground text-sm">{description}</p>
        )}
      </div>
      <ol className="space-y-3">
        {itemFields.map((itemField) => (
          <li key={itemField.config.name}>
            <SettingField {...itemField} />
          </li>
        ))}
      </ol>
    </>
  );
}
