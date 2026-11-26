"use client";

import { useId } from "react";
import { useController } from "react-hook-form";

import { Label } from "#components/_ui/label.tsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "#components/_ui/select.tsx";

import type {
  CommonSettingFieldProps,
  SettingValues,
} from "../setting-field.tsx";

export interface SettingsSelectFieldProps extends CommonSettingFieldProps {
  options: { value: string; label: string }[];
}

export function SettingsSelectField({
  name,
  label,
  description,
  options,
}: SettingsSelectFieldProps) {
  const id = useId();

  const {
    field: { ref, value, onBlur: handleBlur, onChange: handleChange },
  } = useController<SettingValues>({ name });

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {description && (
        <p className="text-muted-foreground text-sm">{description}</p>
      )}
      <div className="flex max-w-xl items-center gap-2">
        <Select
          name={name}
          value={typeof value === "string" ? value : ""}
          onValueChange={handleChange}
        >
          <SelectTrigger
            ref={ref}
            id={id}
            onBlur={handleBlur}
            className="max-w-xs"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
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
