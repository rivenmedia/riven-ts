import { cn } from "cn";
import { CalendarIcon } from "lucide-react";
import { DateTime, Settings } from "luxon";
import { useState } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { useHookFormMask } from "use-mask-input";

import { Button } from "#components/_ui/button.tsx";
import { Calendar } from "#components/_ui/calendar.tsx";
import { Input } from "#components/_ui/input.tsx";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "#components/_ui/popover.tsx";

import type { ChangeEvent, ComponentProps } from "react";
import type { IntClosedRange } from "type-fest";

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
  const dateTimeFormat = "yyyy-MM-dd";
  const { register, setValue } = useFormContext();
  const registerWithMask = useHookFormMask(register);
  const [rawInputValue, setRawInputValue] = useState("");
  const datetimeValue = useWatch<
    Partial<Record<string, string>>,
    unknown,
    DateTime | null
  >({
    defaultValue: {
      [name]: defaultValue ?? "",
    },
    compute(data) {
      const fieldValue = data[name];

      if (!fieldValue) {
        return null;
      }

      try {
        return DateTime.fromFormat(fieldValue, dateTimeFormat);
      } catch {
        return null;
      }
    },
  });

  const maskFormat = "YYYY-MM-DD" as const;

  const field = registerWithMask(name, "datetime", {
    inputFormat: maskFormat,
    jitMasking: true,
    placeholder: " ",
    showMaskOnHover: false,
    showMaskOnFocus: false,
    required,
    onChange(event: ChangeEvent<HTMLInputElement>) {
      setRawInputValue(event.target.value);
    },
  });

  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={cn("flex w-full items-center gap-2")}>
      <div className="relative flex-1">
        {/* <!-- Ghost text for "YYYY-MM-DD" mask. Only show when user is typing (value exists) to avoid overlap with placeholder --> */}
        {rawInputValue && (
          <div className="pointer-events-none absolute inset-0 flex items-center px-3 font-mono text-sm tracking-normal">
            <span className="opacity-0">{rawInputValue}</span>
            <span className="text-muted-foreground/50">
              {maskFormat.slice(rawInputValue.trim().length)}
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
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <Button
          asChild
          aria-label="Open datepicker"
          variant="outline"
          size="icon"
          className={cn(
            "aspect-square",
            !datetimeValue && "text-muted-foreground",
          )}
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
            locale={{
              code: Settings.defaultLocale,
              options: {
                weekStartsOn: DateTime.now()
                  .startOf("week", { useLocaleWeeks: true })
                  .toJSDate()
                  .getDay() as IntClosedRange<0, 6>,
              },
            }}
            mode="single"
            onSelect={(date) => {
              if (!date) {
                return;
              }

              setValue(name, DateTime.fromJSDate(date).toISODate());
              setIsOpen(false);
            }}
            today={DateTime.now().toJSDate()}
            selected={datetimeValue?.toJSDate()}
            captionLayout="dropdown"
            {...(datetimeValue && {
              defaultMonth: datetimeValue.toJSDate(),
            })}
            {...(minDate && { startMonth: minDate.toJSDate() })}
            {...(maxDate && { endMonth: maxDate.toJSDate() })}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
