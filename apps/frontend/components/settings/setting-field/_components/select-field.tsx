import { useId, useMemo } from "react";
import { useFormContext } from "react-hook-form";

import { Label } from "#components/_ui/label.tsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "#components/_ui/select.tsx";

import type { CommonSettingFieldProps } from "#components/settings/setting-field/setting-field.tsx";
import type { RegisterOptions } from "react-hook-form";

export interface SettingsSelectFieldProps extends CommonSettingFieldProps {
  registerOptions?: RegisterOptions;
  options: { value: string; label: string }[];
}

export function SettingsSelectField({
  name,
  label,
  description,
  ...props
}: SettingsSelectFieldProps) {
  const id = useId();

  const { register, getValues, setValue } = useFormContext<{
    [name]: string;
  }>();
  const defaultValue = useMemo(() => getValues(name), [getValues, name]);
  const field = register(name, props.registerOptions);

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {description && (
        <p className="text-muted-foreground text-sm">{description}</p>
      )}
      <div className="flex max-w-xl items-center gap-2">
        <Select
          {...props}
          {...field}
          defaultValue={defaultValue}
          onValueChange={(value) => {
            setValue(name, value, {
              shouldDirty: true,
              shouldTouch: true,
            });
          }}
        >
          <SelectTrigger className="max-w-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {props.options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
