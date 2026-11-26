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

const values = {
  true: "true",
  false: "false",
  null: "null",
} as const;

/** Parses the chosen option into the setting's value. */
function toSettingValue(value: string) {
  if (value === values.true) {
    return true;
  }

  if (value === values.false) {
    return false;
  }

  return null;
}

export interface SettingsNullableBooleanFieldProps extends CommonSettingFieldProps {
  trueLabel?: string;
  falseLabel?: string;
}

export function SettingsNullableBooleanField({
  name,
  label,
  description,
  trueLabel = "Yes",
  falseLabel = "No",
}: SettingsNullableBooleanFieldProps) {
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
      <Select
        name={name}
        value={typeof value === "boolean" ? String(value) : values.null}
        onValueChange={(option) => {
          handleChange(toSettingValue(option));
        }}
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
          <SelectItem value={values.null}>Any</SelectItem>
          <SelectItem value={values.true}>{trueLabel}</SelectItem>
          <SelectItem value={values.false}>{falseLabel}</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
