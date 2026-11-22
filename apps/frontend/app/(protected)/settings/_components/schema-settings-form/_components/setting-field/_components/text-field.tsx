"use client";

import { useId } from "react";
import { useFormContext } from "react-hook-form";

import { Input } from "#components/_ui/input.tsx";
import { Label } from "#components/_ui/label.tsx";

import { parseTextInput } from "../_utilities/setting-input.ts";

import type { CommonSettingFieldProps } from "../setting-field.tsx";

export interface SettingsTextFieldProps extends CommonSettingFieldProps {
  /** Whether an emptied input saves `null`, rather than resetting the setting. */
  nullable?: boolean;
}

export function SettingsTextField({
  name,
  label,
  description,
  nullable = false,
}: SettingsTextFieldProps) {
  const id = useId();

  // A native input is registered rather than controlled, as a controlled
  // field emptied to `undefined` would show its default value again
  const { register } = useFormContext();
  const field = register(name, {
    setValueAs: (value) => parseTextInput(value, nullable),
  });

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
