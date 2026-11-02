"use client";

import { get, useFormState } from "react-hook-form";

import { FieldError } from "#components/_ui/field.tsx";

interface SettingFieldErrorProps {
  name: string;
}

/** Shows the form's validation error for a setting, if it has one. */
export function SettingFieldError({ name }: SettingFieldErrorProps) {
  const { errors } = useFormState({ name });
  const error: unknown = get(errors, name);

  if (
    typeof error !== "object" ||
    !error ||
    !("message" in error) ||
    typeof error.message !== "string"
  ) {
    return null;
  }

  return <FieldError errors={[{ message: error.message }]} />;
}
