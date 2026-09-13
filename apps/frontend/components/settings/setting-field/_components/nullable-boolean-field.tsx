import { Label } from "@/components/_ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/_ui/select";

import { useId, useMemo } from "react";
import { useFormContext } from "react-hook-form";

import type { CommonSettingFieldProps } from "../setting-field";
import type { RegisterOptions } from "react-hook-form";
import type { Except } from "type-fest";

const values = {
  true: "true",
  false: "false",
  null: "null",
} as const;

export interface SettingsNullableBooleanFieldProps extends CommonSettingFieldProps {
  registerOptions?: Except<
    RegisterOptions,
    "valueAsDate" | "valueAsNumber" | "setValueAs"
  >;
  trueLabel?: string;
  falseLabel?: string;
  defaultValue?: keyof typeof values;
}

export function SettingsNullableBooleanField({
  name,
  label,
  description,
  trueLabel = "Yes",
  falseLabel = "No",
  ...props
}: SettingsNullableBooleanFieldProps) {
  const id = useId();

  const { register, getValues } = useFormContext<{ [name]: boolean | null }>();
  const defaultValue = useMemo(() => getValues(name), [getValues, name]);
  const field = register(name, {
    ...props.registerOptions,
    setValueAs(value) {
      if (value === values.true) {
        return true;
      }

      if (value === values.false) {
        return false;
      }

      return null;
    },
  });

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {description && (
        <p className="text-muted-foreground text-sm">{description}</p>
      )}
      <Select {...props} {...field} defaultValue={String(defaultValue)}>
        <SelectTrigger className="max-w-xs">
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
