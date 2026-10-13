import { Input } from "@repo/util-ui/components/_ui/input.tsx";
import { Label } from "@repo/util-ui/components/_ui/label.tsx";

import { useId } from "react";
import { useFormContext } from "react-hook-form";

import type { CommonSettingFieldProps } from "#components/settings/setting-field/setting-field.tsx";
import type { RegisterOptions } from "react-hook-form";

export interface SettingsTextFieldProps extends CommonSettingFieldProps {
  registerOptions?: RegisterOptions;
}

export function SettingsTextField({
  name,
  label,
  description,
  registerOptions,
}: SettingsTextFieldProps) {
  const id = useId();

  const { register } = useFormContext();
  const field = register(name, registerOptions);

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {description && (
        <p className="text-muted-foreground text-sm">{description}</p>
      )}
      <Input {...field} id={id} className="max-w-xl" />
    </div>
  );
}
