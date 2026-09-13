import { Button } from "@/components/_ui/button";
import { ButtonGroup } from "@/components/_ui/button-group";
import { Input } from "@/components/_ui/input";
import { Label } from "@/components/_ui/label";

import { Eye, EyeOff } from "lucide-react";
import { useId, useState } from "react";
import { useFormContext } from "react-hook-form";

import type { CommonSettingFieldProps } from "../setting-field";
import type { RegisterOptions } from "react-hook-form";

export interface SettingsSecretFieldProps extends CommonSettingFieldProps {
  registerOptions?: RegisterOptions;
}

export function SettingsSecretField({
  name,
  label,
  description,
  ...props
}: SettingsSecretFieldProps) {
  const id = useId();

  const { register } = useFormContext();
  const field = register(name, props.registerOptions);

  const [isValueVisible, setIsValueVisible] = useState(false);

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {description && (
        <p className="text-muted-foreground text-sm">{description}</p>
      )}
      <div className="flex max-w-xl items-center gap-2">
        <Input
          {...props}
          {...field}
          id={id}
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
