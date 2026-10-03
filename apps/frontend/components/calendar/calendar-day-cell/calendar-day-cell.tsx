import { cn } from "cn";
import { DateTime } from "luxon";

import { DayItemsList } from "../day-items-list/day-items-list";

import type { CalendarDay } from "../types";

export interface CalendarDayCellProps {
  day: CalendarDay;
  isToday: boolean;
}

function getDayNumberClassName(isToday: boolean, isCurrentMonth: boolean) {
  if (isToday) {
    return "bg-primary text-primary-foreground";
  }

  return isCurrentMonth ? "text-foreground" : "text-muted-foreground/70";
}

export function CalendarDayCell({ day, isToday }: CalendarDayCellProps) {
  return (
    <div
      aria-current={isToday ? "date" : undefined}
      aria-label={day.date.toLocaleString(DateTime.DATE_FULL)}
      // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role
      role="gridcell"
      className={cn(
        "group/day min-h-32 rounded-md border p-2 transition-colors",
        day.isCurrentMonth
          ? "bg-background/50 border-border/70 hover:border-primary/30 hover:bg-accent/30"
          : "bg-muted/10 border-border/30 text-muted-foreground/60",
        day.items.length > 0 && day.isCurrentMonth && "bg-card/80",
        isToday && "border-primary/70 bg-primary/5",
      )}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <div
          className={cn(
            "flex size-7 items-center justify-center rounded-md text-sm font-semibold",
            getDayNumberClassName(isToday, day.isCurrentMonth),
          )}
        >
          {day.date.day}
        </div>
        {day.items.length > 0 && (
          <span className="bg-muted text-muted-foreground rounded-full px-1.5 py-0.5 text-[10px] font-semibold">
            {day.items.length}
          </span>
        )}
      </div>
      <DayItemsList day={day} limit={3} showMore />
    </div>
  );
}
