import { Input } from "@/components/_ui/input";
import { Label } from "@/components/_ui/label";
import { Switch } from "@/components/_ui/switch";

import { useId } from "react";
import { useFormContext } from "react-hook-form";

import type { CommonSettingFieldProps } from "../setting-field";

export function SettingsCustomRankField({
  name,
  label,
  description,
}: CommonSettingFieldProps) {
  const id = useId();

  const { register, setValue, watch } = useFormContext<{
    [name]: { fetch: true; rank: number } | { fetch: false; rank?: never };
  }>();

  const fetchField = register(`${name}.fetch`);
  const fetchEnabled = watch(`${name}.fetch`);
  const rankField = register(`${name}.rank`, {
    disabled: !fetchEnabled,
    valueAsNumber: true,
  });

  return (
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
            {...fetchField}
            defaultChecked={fetchEnabled}
            onCheckedChange={(checked) => {
              setValue(`${name}.fetch`, checked);
            }}
          />
        </Label>
        <Input {...rankField} id={id} type="number" className="h-8 w-24 " />
      </div>
    </div>
  );
}
