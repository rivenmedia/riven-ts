import { Checkbox } from "@/components/_ui/checkbox";
import { cn } from "@/lib/utils";

import { useState } from "react";

import { getTypeStyle } from "../utilities/get-type-style";

import type { FilterOption } from "../types";

export interface TypeFilterChipsProps {
  options: FilterOption[];
  filters: Record<string, boolean>;
}

export function TypeFilterChips({ options, filters }: TypeFilterChipsProps) {
  const [selected, setSelected] = useState<Record<string, boolean>>({
    ...filters,
  });

  return (
    <section className="flex flex-wrap items-center gap-2">
      {options.map(({ icon: Icon, id, label, type }) => {
        const isSelected = selected[type] !== false;
        const style = getTypeStyle(type);

        return (
          <label
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
                setSelected((prev) => ({
                  ...prev,
                  [type]: Boolean(checked),
                }));
              }}
            />
            <Icon className={cn("h-4 w-4", style.icon)} />
            {label}
          </label>
        );
      })}
    </section>
  );
}
