import { useId, useMemo } from "react";
import { useFormContext } from "react-hook-form";

import { Label } from "#components/_ui/label.tsx";
import { Switch } from "#components/_ui/switch.tsx";

import type { CommonSettingFieldProps } from "#components/settings/setting-field/setting-field.tsx";
import type { RegisterOptions } from "react-hook-form";

export interface SettingsBooleanFieldProps extends CommonSettingFieldProps {
  registerOptions?: RegisterOptions;
}

export function SettingsBooleanField({
  name,
  label,
  description,
  ...props
}: SettingsBooleanFieldProps) {
  const id = useId();

  const { register, getValues, setValue } = useFormContext<{
    [name]: boolean;
  }>();
  const defaultValue = useMemo(() => getValues(name), [getValues, name]);
  const field = register(name, props.registerOptions);

  return (
    <div className="flex items-center justify-between gap-4">
      <div className="space-y-0.5">
        <Label className="text-sm" htmlFor={id}>
          {label}
        </Label>
        {description && (
          <p className="text-muted-foreground text-sm">{description}</p>
        )}
      </div>
      <Switch
        {...props}
        {...field}
        id={id}
        defaultChecked={defaultValue}
        onCheckedChange={(checked) => {
          setValue(name, checked, {
            shouldDirty: true,
            shouldTouch: true,
          });
        }}
      />
    </div>
  );
}
