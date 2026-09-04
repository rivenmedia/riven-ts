import { Button } from "@/components/_ui/button";
import { CalendarDayCell } from "@/components/calendar/calendar-day-cell/calendar-day-cell";
import { CalendarMobileDayCard } from "@/components/calendar/calendar-mobile-day-card/calendar-mobile-day-card";
import { TypeFilterChips } from "@/components/calendar/type-filter-chips/type-filter-chips";
import { PageShell } from "@/components/page-shell/page-shell";

import { ChevronLeft, ChevronRight, Film, Tv } from "lucide-react";
import { DateTime, Interval } from "luxon";
import { useState } from "react";
import { useMedia } from "react-use";

import type { EntertainmentItemData } from "@/components/calendar/types";

interface CalendarPageProps {
  calendar: {
    data: EntertainmentItemData[];
  };
}

export function CalendarPage({ calendar }: CalendarPageProps) {
  const isMobile = useMedia("(max-width: 768px)");

  const today = DateTime.local();
  const currentMonth = today.startOf("month");
  const [selectedDate, setSelectedDate] = useState(currentMonth);

  const filterOptions = [
    { id: "movies", label: "Movies", type: "movie", icon: Film },
    { id: "episodes", label: "Episodes", type: "episode", icon: Tv },
    { id: "shows", label: "Shows", type: "show", icon: Tv },
    { id: "seasons", label: "Seasons", type: "season", icon: Tv },
  ] as const;

  const [selectedFilters, setSelectedFilters] = useState(
    Object.fromEntries(filterOptions.map(({ type }) => [type, true])),
  );

  const dayNames = Interval.fromDateTimes(
    today.startOf("week"),
    today.endOf("week"),
  )
    .splitBy({ days: 1 })
    .map((interval) => interval.start.toFormat("ccc"));

  const itemsByDate = () => {
    const result: Record<string, EntertainmentItemData[]> = {};

    for (const item of calendar.data) {
      const dateKey = DateTime.fromISO(item.airedAt).startOf("day").toISO();

      (result[dateKey] ??= []).push(item);
    }

    return result;
  };

  const filteredItemsByDate = () => {
    const result: Record<string, EntertainmentItemData[]> = {};

    for (const [dateKey, items] of Object.entries(itemsByDate())) {
      result[dateKey] = items.filter(
        (item) => selectedFilters[item.itemType] !== false,
      );
    }

    return result;
  };

  const calendarDays = selectedDate
    .minus({ day: 1 })
    .until(selectedDate.plus({ months: 1 }))
    .splitBy({ days: 1 })
    .map((interval) => {
      const dateKey = interval.start.toISO();

      return {
        date: interval.start,
        isCurrentMonth: interval.start.hasSame(selectedDate, "month"),
        items: filteredItemsByDate()[dateKey] ?? [],
        dateKey,
      };
    });

  const currentMonthDays = calendarDays.filter((day) => day.isCurrentMonth);
  const visibleMonthDays = currentMonthDays.filter(
    (day) => day.items.length > 0,
  );

  return (
    <PageShell className="mx-auto h-full w-full max-w-450 gap-5">
      <header className="border-border/60 flex flex-col gap-4 border-b pb-5 md:flex-row md:items-end md:justify-between">
        <h1 className="truncate text-3xl font-bold tracking-tight">
          {selectedDate.toFormat("LLLL yyyy")}
        </h1>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon-sm"
            aria-label="Previous month"
            onClick={() => {
              setSelectedDate(selectedDate.minus({ months: 1 }));
            }}
            type="button"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            aria-label="Next month"
            onClick={() => {
              setSelectedDate(selectedDate.plus({ months: 1 }));
            }}
            type="button"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <TypeFilterChips
        options={filterOptions}
        filters={selectedFilters}
        onChange={setSelectedFilters}
      />

      <section className="border-border/60 bg-card/30 overflow-hidden rounded-md border">
        <div className="p-2 md:p-3">
          {isMobile ? (
            visibleMonthDays.length > 0 ? (
              <div className="space-y-2">
                {visibleMonthDays.map((day) => (
                  <CalendarMobileDayCard
                    key={day.dateKey}
                    day={day}
                    isToday={day.date.hasSame(today, "day")}
                  />
                ))}
              </div>
            ) : (
              <div className="border-border bg-background/40 text-muted-foreground rounded-md border border-dashed p-8 text-center">
                No releases match the current filters for this month.
              </div>
            )
          ) : (
            <div className="border-border/70 bg-border/70 grid grid-cols-7 gap-px overflow-hidden rounded-md border">
              {dayNames.map((day) => (
                <div
                  key={day}
                  className="bg-muted/40 text-muted-foreground px-3 py-2 text-center text-xs font-bold uppercase"
                >
                  {day}
                </div>
              ))}
              {calendarDays.map((day) => (
                <CalendarDayCell
                  key={day.dateKey}
                  day={day}
                  isToday={day.date.hasSame(today, "day")}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </PageShell>
  );
}
