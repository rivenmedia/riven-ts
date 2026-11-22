"use client";

import { Eye, EyeOff } from "lucide-react";
import { useId, useState } from "react";
import { useFormContext } from "react-hook-form";

import { ButtonGroup } from "#components/_ui/button-group.tsx";
import { Button } from "#components/_ui/button.tsx";
import { Input } from "#components/_ui/input.tsx";
import { Label } from "#components/_ui/label.tsx";

import type { CommonSettingFieldProps } from "../setting-field.tsx";

export interface SettingsPasswordFieldProps extends CommonSettingFieldProps {
  placeholder?: string;
}

export function SettingsPasswordField({
  name,
  label,
  description,
  placeholder,
}: SettingsPasswordFieldProps) {
  const id = useId();

  // A native input is registered rather than controlled, like a text field.
  // A blank secret is left unchanged, so an emptied input stays blank.
  const { register } = useFormContext();
  const field = register(name);

  const [isValueVisible, setIsValueVisible] = useState(false);

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {description && (
        <p className="text-muted-foreground text-sm">{description}</p>
      )}
      <div className="flex max-w-xl items-center gap-2">
        <Input
          {...field}
          id={id}
          placeholder={placeholder}
          type={isValueVisible ? "text" : "password"}
          className="max-w-xl"
        />
        <ButtonGroup className="shrink-0">
          <Button
            aria-label={isValueVisible ? "Hide password" : "Show password"}
            onClick={() => {
              setIsValueVisible(!isValueVisible);
            }}
            variant="outline"
            size="icon"
            type="button"
          >
            {isValueVisible ? <EyeOff /> : <Eye />}
          </Button>
        </ButtonGroup>
      </div>
    </div>
  );
}
