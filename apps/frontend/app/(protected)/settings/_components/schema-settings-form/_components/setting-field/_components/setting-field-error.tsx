"use client";

import { get, useFormState } from "react-hook-form";
import { z } from "zod";

import { FieldError } from "#components/_ui/field.tsx";

const errorSchema = z.object({ message: z.string() });

interface SettingFieldErrorProps {
  name: string;
}

/** Shows the form's validation error for a setting, if it has one. */
export function SettingFieldError({ name }: SettingFieldErrorProps) {
  const { errors } = useFormState({ name });
  const error = errorSchema.safeParse(get(errors, name));

  if (!error.success) {
    return null;
  }

  return <FieldError errors={[{ message: error.data.message }]} />;
}
