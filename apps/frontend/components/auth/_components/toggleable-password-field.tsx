"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { useFormContext } from "react-hook-form";

import { ButtonGroup } from "#components/_ui/button-group.tsx";
import { Button } from "#components/_ui/button.tsx";
import { Field, FieldError, FieldLabel } from "#components/_ui/field.tsx";
import { Input } from "#components/_ui/input.tsx";

import type { UseFormRegisterReturn } from "react-hook-form";

interface ToggleablePasswordFieldProps {
  name: string;
  label: string;
  field: UseFormRegisterReturn;
}

export function ToggleablePasswordField({
  name,
  label,
  field,
}: ToggleablePasswordFieldProps) {
  const form = useFormContext();
  const [passwordVisible, setPasswordVisible] = useState(false);

  function togglePasswordVisibility() {
    setPasswordVisible((prev) => !prev);
  }

  return (
    <Field data-invalid={Boolean(form.formState.errors[name])}>
      <FieldLabel htmlFor={name}>{label}</FieldLabel>
      <ButtonGroup className="w-full">
        <Input
          {...field}
          aria-invalid={Boolean(form.formState.errors[name])}
          id={name}
          type={passwordVisible ? "text" : "password"}
        />
        <Button
          onClick={() => {
            togglePasswordVisibility();
          }}
          variant="outline"
          size="icon"
          aria-label="toggle password visibility"
          type="button"
          tabIndex={-1}
        >
          {passwordVisible ? <EyeOff /> : <Eye />}
        </Button>
      </ButtonGroup>
      <FieldError errors={[form.formState.errors[name]]} />
    </Field>
  );
}
