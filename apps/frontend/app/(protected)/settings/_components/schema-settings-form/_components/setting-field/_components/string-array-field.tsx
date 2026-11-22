"use client";

import React, { useId, useState } from "react";
import { useController } from "react-hook-form";

import {
  Combobox,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
  useComboboxAnchor,
  ComboboxChip,
} from "#components/_ui/combobox.tsx";
import { Label } from "#components/_ui/label.tsx";

import type {
  CommonSettingFieldProps,
  SettingValues,
} from "../setting-field.tsx";

export interface SettingsStringArrayFieldProps extends CommonSettingFieldProps {
  options?: string[];
  allowCustomOptions?: boolean;
}

const defaultOptions: string[] = [];

export function SettingsStringArrayField({
  name,
  label,
  description,
  allowCustomOptions = true,
  options = defaultOptions,
}: SettingsStringArrayFieldProps) {
  const id = useId();
  const anchor = useComboboxAnchor();

  const {
    field: { value: fieldValue, onChange: handleChange },
  } = useController<SettingValues>({ name });

  const value = Array.isArray(fieldValue) ? fieldValue.map(String) : [];
  const [inputValue, setInputValue] = useState("");

  const trimmed = inputValue.trim();
  const isNewOption =
    allowCustomOptions &&
    trimmed.length > 0 &&
    !options.some((option) => option.toLowerCase() === trimmed.toLowerCase()) &&
    !value.some((val) => val.toLowerCase() === trimmed.toLowerCase());

  const items = isNewOption ? [...options, trimmed] : options;

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {description && (
        <p className="text-muted-foreground text-sm">{description}</p>
      )}
      <Combobox
        multiple
        autoHighlight
        items={items}
        value={value}
        onValueChange={handleChange}
        onInputValueChange={setInputValue}
      >
        <ComboboxChips ref={anchor} className="w-full max-w-xs">
          <ComboboxValue>
            {(values: string[]) => (
              <>
                {values.map((val) => (
                  <ComboboxChip key={val}>{val}</ComboboxChip>
                ))}
                <ComboboxChipsInput id={id} />
              </>
            )}
          </ComboboxValue>
        </ComboboxChips>
        <ComboboxContent anchor={anchor}>
          <ComboboxEmpty>
            {allowCustomOptions
              ? "Begin typing to add a custom value."
              : "No options"}
          </ComboboxEmpty>
          <ComboboxList>
            {(item: string, index) => (
              <React.Fragment key={item}>
                <ComboboxItem value={item}>
                  {item === trimmed && isNewOption ? `Add "${item}"` : item}
                </ComboboxItem>
                {index === items.length - 1 &&
                  allowCustomOptions &&
                  trimmed === "" && (
                    <ComboboxItem disabled>
                      Begin typing to add a custom value.
                    </ComboboxItem>
                  )}
              </React.Fragment>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </div>
  );
}
