import { Input } from "@/components/_ui/input";
import { Label } from "@/components/_ui/label";

import { useId } from "react";
import { useFormContext } from "react-hook-form";

import type { CommonSettingFieldProps } from "../setting-field";
import type { RegisterOptions } from "react-hook-form";

export interface SettingsTextFieldProps extends CommonSettingFieldProps {
  registerOptions?: RegisterOptions;
}

export function SettingsTextField({
  name,
  label,
  description,
  ...props
}: SettingsTextFieldProps) {
  const id = useId();

  const { register } = useFormContext();
  const field = register(name, props.registerOptions);

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {description && (
        <p className="text-muted-foreground text-sm">{description}</p>
      )}
      <Input {...props} {...field} id={id} className="max-w-xl" />
    </div>
  );
}
