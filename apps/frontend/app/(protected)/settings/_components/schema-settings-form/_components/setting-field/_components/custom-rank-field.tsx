"use client";

import { useId } from "react";
import { useController, useFormContext } from "react-hook-form";

import { Input } from "#components/_ui/input.tsx";
import { Label } from "#components/_ui/label.tsx";
import { Switch } from "#components/_ui/switch.tsx";

import { SettingFieldError } from "./setting-field-error.tsx";

import type {
  CommonSettingFieldProps,
  SettingValues,
} from "../setting-field.tsx";

export type SettingsCustomRankFieldProps = CommonSettingFieldProps;

export function SettingsCustomRankField({
  name,
  label,
  description,
}: SettingsCustomRankFieldProps) {
  const id = useId();

  const {
    field: {
      ref: fetchRef,
      value: fetchValue,
      onBlur: handleFetchBlur,
      onChange: handleFetchChange,
    },
  } = useController<SettingValues>({ name: `${name}.fetch` });
  const fetchEnabled = fetchValue === true;

  // A rank that isn't fetched has no rank, so it's left out of the value. A
  // fetched rank can't be emptied, so an emptied input is left as `NaN` for
  // validation to catch, rather than resetting it. Its native input is
  // registered rather than controlled, like a number field.
  const { register } = useFormContext();
  const rankField = register(`${name}.rank`, {
    disabled: !fetchEnabled,
    valueAsNumber: true,
  });

  return (
    <div className="space-y-2">
      <div className="bg-muted/30 flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm">
        <div>
          <span className="min-w-0 truncate">{label}</span>
          {description && (
            <p className="text-muted-foreground text-sm">{description}</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <Label className="flex items-center gap-2">
            Fetch
            <Switch
              ref={fetchRef}
              name={`${name}.fetch`}
              checked={fetchEnabled}
              onBlur={handleFetchBlur}
              onCheckedChange={handleFetchChange}
            />
          </Label>
          <Label htmlFor={id} className="sr-only">
            {label} rank
          </Label>
          <Input {...rankField} id={id} type="number" className="h-8 w-24 " />
        </div>
      </div>
      <SettingFieldError name={`${name}.fetch`} />
      <SettingFieldError name={`${name}.rank`} />
    </div>
  );
}
