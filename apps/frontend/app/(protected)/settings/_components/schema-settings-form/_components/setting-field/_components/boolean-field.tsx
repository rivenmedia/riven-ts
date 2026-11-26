"use client";

import { useId } from "react";
import { useController } from "react-hook-form";

import { Label } from "#components/_ui/label.tsx";
import { Switch } from "#components/_ui/switch.tsx";

import type {
  CommonSettingFieldProps,
  SettingValues,
} from "../setting-field.tsx";

export type SettingsBooleanFieldProps = CommonSettingFieldProps;

export function SettingsBooleanField({
  name,
  label,
  description,
}: SettingsBooleanFieldProps) {
  const id = useId();

  const {
    field: { ref, value, onBlur: handleBlur, onChange: handleChange },
  } = useController<SettingValues>({ name });

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
        ref={ref}
        id={id}
        name={name}
        checked={value === true}
        onBlur={handleBlur}
        onCheckedChange={handleChange}
      />
    </div>
  );
}
