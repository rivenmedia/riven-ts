import { Checkbox } from "@/components/_ui/checkbox";
import { Label } from "@/components/_ui/label";
import { cn } from "@/lib/utils";

import { getTypeStyle } from "../utilities/get-type-style";

import type { FilterOption } from "../types";

export interface TypeFilterChipsProps {
  options: readonly FilterOption[];
  filters: Record<string, boolean>;
  onChange: (filters: Record<string, boolean>) => void;
}

export function TypeFilterChips({
  options,
  filters,
  onChange,
}: TypeFilterChipsProps) {
  return (
    <section className="flex flex-wrap items-center gap-2">
      {options.map(({ icon: Icon, id, label, type }) => {
        const isSelected = filters[type] !== false;
        const style = getTypeStyle(type);

        return (
          <Label
            key={id}
            htmlFor={id}
            className={cn(
              "border-border bg-card/50 hover:bg-accent/50 flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition-colors",
              isSelected && "border-primary/40 bg-primary/10 text-foreground",
              !isSelected && "text-muted-foreground",
            )}
          >
            <Checkbox
              id={id}
              checked={isSelected}
              className="size-4"
              onCheckedChange={(checked) => {
                onChange({
                  ...filters,
                  [type]: Boolean(checked),
                });
              }}
            />
            <Icon className={cn("h-4 w-4", style.icon)} />
            {label}
          </Label>
        );
      })}
    </section>
  );
}
