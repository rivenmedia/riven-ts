import { cn } from "@/lib/utils";

import { DayItemsList } from "../day-items-list/day-items-list";

import type { CalendarDay } from "../types";

export interface CalendarDayCellProps {
  day: CalendarDay;
  isToday: boolean;
}

export function CalendarDayCell({ day, isToday }: CalendarDayCellProps) {
  return (
    <div
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
            isToday
              ? "bg-primary text-primary-foreground"
              : day.isCurrentMonth
                ? "text-foreground"
                : "text-muted-foreground/70",
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
