import { Input } from "@/components/_ui/input";
import { Label } from "@/components/_ui/label";

import { useId } from "react";
import { useFormContext } from "react-hook-form";

import type { CommonSettingFieldProps } from "../setting-field";
import type { ComponentProps } from "react";
import type { RegisterOptions } from "react-hook-form";

export interface SettingsNumberFieldProps
  extends Pick<ComponentProps<"input">, "step">, CommonSettingFieldProps {
  registerOptions?: RegisterOptions;
}

export function SettingsNumberField({
  name,
  label,
  description,
  ...props
}: SettingsNumberFieldProps) {
  const id = useId();

  const { register } = useFormContext();
  const field = register(name, props.registerOptions);

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {description && (
        <p className="text-muted-foreground text-sm">{description}</p>
      )}
      <div className="flex max-w-xl items-center gap-2">
        <Input
          {...props}
          {...field}
          id={id}
          className="max-w-xl"
          type="number"
        />
      </div>
    </div>
  );
}
