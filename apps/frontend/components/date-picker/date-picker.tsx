import { cn } from "@/lib/utils";

import { CalendarIcon } from "lucide-react";
import { DateTime } from "luxon";
import { useFormContext, useWatch } from "react-hook-form";
import { useHookFormMask } from "use-mask-input";

import { Button } from "../_ui/button";
import { Calendar } from "../_ui/calendar";
import { Input } from "../_ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "../_ui/popover";

import type { ComponentProps } from "react";

interface DatePickerProps extends Pick<ComponentProps<"input">, "aria-label"> {
  name: string;
  defaultValue?: string;
  placeholder: string;
  minDate?: DateTime;
  maxDate?: DateTime;
  required?: boolean;
}

export function DatePicker({
  name,
  defaultValue,
  placeholder,
  minDate,
  maxDate,
  required = false,
  "aria-label": ariaLabel = "Select a date",
}: DatePickerProps) {
  const { register, setValue } = useFormContext();
  const registerWithMask = useHookFormMask(register);
  const value = useWatch<Partial<Record<string, string>>>({
    name,
    defaultValue: defaultValue ?? "",
  });
  const maskFormat = "YYYY-MM-DD" as const;

  const field = registerWithMask(name, "datetime", {
    inputFormat: maskFormat,
    jitMasking: true,
    placeholder: " ",
    showMaskOnHover: false,
    showMaskOnFocus: false,
    required,
  });

  return (
    <div className={cn("flex w-full items-center gap-2")}>
      <div className="relative flex-1">
        {/* <!-- Ghost text for "YYYY-MM-DD" mask. Only show when user is typing (value exists) to avoid overlap with placeholder --> */}
        {value && (
          <div className="pointer-events-none absolute inset-0 flex items-center px-3 font-mono text-sm tracking-normal">
            <span className="opacity-0">{value}</span>
            <span className="text-muted-foreground/50">
              {maskFormat.slice(value.trim().length)}
            </span>
          </div>
        )}
        <Input
          {...field}
          aria-label={ariaLabel}
          type="text"
          defaultValue={defaultValue}
          className="relative z-10 w-full bg-transparent font-mono text-sm"
          placeholder={placeholder}
        />
      </div>
      <Popover>
        <Button
          asChild
          aria-label="Open datepicker"
          variant="outline"
          size="icon"
          className={cn("aspect-square", !value && "text-muted-foreground")}
        >
          <PopoverTrigger>
            <CalendarIcon className="size-4" />
          </PopoverTrigger>
        </Button>
        <PopoverContent
          className="w-auto rounded-2xl border border-white/10 bg-zinc-950/95 p-0 shadow-2xl shadow-black/50 backdrop-blur-2xl"
          align="end"
        >
          <Calendar
            mode="single"
            onSelect={(date) => {
              if (!date) {
                return;
              }

              setValue(name, DateTime.fromJSDate(date).toISODate());
            }}
            selected={
              value
                ? DateTime.fromFormat(value, "yyyy-MM-dd").toJSDate()
                : undefined
            }
            captionLayout="dropdown"
            {...(minDate && { startMonth: minDate.toJSDate() })}
            {...(maxDate && { endMonth: maxDate.toJSDate() })}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
