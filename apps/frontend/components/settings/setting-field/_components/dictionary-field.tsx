import { Button } from "@/components/_ui/button";
import { Input } from "@/components/_ui/input";
import { Label } from "@/components/_ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/_ui/tooltip";

import { Trash } from "lucide-react";
import { useId } from "react";
import { useFieldArray, useFormContext } from "react-hook-form";

import { SettingField } from "../setting-field";

import type {
  CommonSettingFieldProps,
  SettingFieldProps,
} from "../setting-field";

export interface SettingsDictionaryFieldProps extends CommonSettingFieldProps {
  keyLabel?: string;
  addLabel?: string;
  keyPlaceholder?: string;
  itemFields: SettingFieldProps[];
}

export function SettingsDictionaryField({
  name,
  label,
  description,
  addLabel,
  keyLabel = "Key",
  keyPlaceholder,
  itemFields,
}: SettingsDictionaryFieldProps) {
  const id = useId();

  const { register, getValues } = useFormContext();
  const { append, fields, remove } = useFieldArray<{
    [name]: { key: string }[];
  }>({
    name,
    rules: {
      validate: (value) => {
        const keySet = new Set(value.map((item) => item.key));

        return keySet.size === value.length || "Duplicate keys are not allowed";
      },
    },
  });

  return (
    <>
      <div className="space-y-1">
        <Label className="text-base">{label}</Label>
        {description && (
          <p className="text-muted-foreground text-sm">{description}</p>
        )}
      </div>
      <div className="space-y-3">
        {fields.map((field, fieldIndex) => {
          const fieldKey = String(
            getValues(`${name}.${fieldIndex.toString()}.key`),
          );

          return (
            <div key={field.id} className="space-y-3 rounded-lg border p-3">
              <div className="flex items-end gap-3">
                <div className="min-w-0 flex-1 space-y-2">
                  <Label htmlFor={`${id}-${fieldIndex.toString()}-key`}>
                    {keyLabel}
                  </Label>
                  <Input
                    {...register(`${name}.${fieldIndex.toString()}.key`)}
                    id={`${id}-${fieldIndex.toString()}-key`}
                    placeholder={keyPlaceholder ?? "Insert a unique key here"}
                  />
                </div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      aria-label={`Remove ${fieldKey}`}
                      type="button"
                      variant="destructive"
                      size="icon"
                      onClick={() => {
                        remove(fieldIndex);
                      }}
                    >
                      <Trash />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Remove entry</TooltipContent>
                </Tooltip>
              </div>
              <div className="space-y-3">
                {itemFields.map((itemField) => (
                  <SettingField
                    key={itemField.config.name}
                    {...itemField}
                    parentName={`${name}.${fieldIndex.toString()}`}
                    nested
                  />
                ))}
              </div>
            </div>
          );
        })}

        <button
          type="button"
          className="rounded-md border px-3 py-2 text-sm"
          onClick={() => {
            const fieldDefaults = Object.fromEntries(
              itemFields.map((itemField) => [itemField.config.name, ""]),
            );

            append({
              ...fieldDefaults,
              key: "",
            });
          }}
        >
          {addLabel ?? "Add entry"}
        </button>
      </div>
    </>
  );
}
