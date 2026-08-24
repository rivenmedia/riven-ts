import { useFormContext, useWatch } from "react-hook-form";

import { Checkbox } from "../_ui/checkbox";
import { Label } from "../_ui/label";
import { Toggle } from "../_ui/toggle";

export interface SelectablePillProps {
  label: string;
  value: string | number;
  name: string;
  onChange?: (checked: boolean) => void;
}

export function SelectablePill({
  value,
  label,
  name,
  onChange,
}: SelectablePillProps) {
  const { register, setValue } = useFormContext();
  const isChecked = useWatch<Record<string, boolean>>({
    name: `${name}.${value.toString()}`,
  });

  return (
    <Toggle
      asChild
      key={value}
      size="sm"
      variant="outline"
      className="h-7 px-2 text-xs"
      pressed={isChecked}
    >
      <Label>
        <div className="sr-only">
          <Checkbox
            {...register(name)}
            value={value}
            onCheckedChange={(checked) => {
              if (checked === "indeterminate") {
                return;
              }

              setValue(`${name}.${value.toString()}`, checked, {
                shouldDirty: true,
              });

              onChange?.(checked);
            }}
          />
        </div>
        {label}
      </Label>
    </Toggle>
  );
}
