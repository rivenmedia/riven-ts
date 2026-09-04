import { cn } from "@/lib/utils";

import { DayItemsList } from "../day-items-list/day-items-list";
import { formatDayTitle } from "../utilities/format-day-title";

import type { CalendarDay } from "../types";

export interface CalendarMobileDayCardProps {
  day: CalendarDay;
  isToday: boolean;
}

export function CalendarMobileDayCard({
  day,
  isToday,
}: CalendarMobileDayCardProps) {
  return (
    <li
      aria-current={isToday ? "date" : undefined}
      className={cn(
        "bg-card/80 border-border rounded-md border p-3",
        isToday && "border-primary/70 bg-primary/5",
      )}
    >
      <div className="mb-3 flex items-center justify-between">
        <div className={cn("text-lg font-semibold", isToday && "text-primary")}>
          {formatDayTitle(day.date)}
        </div>
        <div className="text-muted-foreground text-sm">
          {day.items.length} item{day.items.length === 1 ? "" : "s"}
        </div>
      </div>
      <DayItemsList day={day} />
    </li>
  );
}
