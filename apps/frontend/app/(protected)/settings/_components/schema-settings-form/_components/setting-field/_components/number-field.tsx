"use client";

import { useId } from "react";
import { useFormContext } from "react-hook-form";

import { Input } from "#components/_ui/input.tsx";
import { Label } from "#components/_ui/label.tsx";

import { parseNumberInput } from "../_utilities/setting-input.ts";

import type { CommonSettingFieldProps } from "../setting-field.tsx";
import type { ComponentProps } from "react";

export interface SettingsNumberFieldProps
  extends Pick<ComponentProps<"input">, "step">, CommonSettingFieldProps {
  /** Whether an emptied input saves `null`, rather than resetting the setting. */
  nullable?: boolean;
}

export function SettingsNumberField({
  name,
  label,
  description,
  nullable = false,
  step,
}: SettingsNumberFieldProps) {
  const id = useId();

  // A native input is registered rather than controlled, as a controlled
  // field emptied to `undefined` would show its default value again
  const { register } = useFormContext();
  const field = register(name, {
    setValueAs: (value) => parseNumberInput(value, nullable),
  });

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {description && (
        <p className="text-muted-foreground text-sm">{description}</p>
      )}
      <div className="flex max-w-xl items-center gap-2">
        <Input
          {...field}
          id={id}
          step={step}
          className="max-w-xl"
          type="number"
        />
      </div>
    </div>
  );
}
