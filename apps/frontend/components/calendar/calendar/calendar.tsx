import { Button } from "@/components/_ui/button";

import { ChevronLeft, ChevronRight, Film, Tv } from "lucide-react";
import { DateTime } from "luxon";
import { useMemo, useState } from "react";
import { useMedia } from "react-use";

import { CalendarDayCell } from "../calendar-day-cell/calendar-day-cell";
import { CalendarMobileDayCard } from "../calendar-mobile-day-card/calendar-mobile-day-card";
import { TypeFilterChips } from "../type-filter-chips/type-filter-chips";
import { useCalendar } from "./use-calendar";

import type { EntertainmentItemData } from "../types";

export interface CalendarProps {
  items: EntertainmentItemData[];
}

export function Calendar({ items }: CalendarProps) {
  const { dayNames, selectedDate, setSelectedDate, currentMonthDays, isToday } =
    useCalendar();

  const shouldRenderMobileCalendar = useMedia("(max-width: 768px)");

  const filterOptions = [
    { id: "movies", label: "Movies", type: "movie", icon: Film },
    { id: "episodes", label: "Episodes", type: "episode", icon: Tv },
    { id: "shows", label: "Shows", type: "show", icon: Tv },
    { id: "seasons", label: "Seasons", type: "season", icon: Tv },
  ] as const;

  const [selectedFilters, setSelectedFilters] = useState(
    Object.fromEntries(filterOptions.map(({ type }) => [type, true])),
  );

  const filteredItems = useMemo(() => {
    const result: Record<string, EntertainmentItemData[]> = {};

    for (const item of items) {
      if (selectedFilters[item.itemType] === false) {
        continue;
      }

      const dateKey = DateTime.fromISO(item.airedAt).startOf("day").toISO();

      (result[dateKey] ??= []).push(item);
    }

    return result;
  }, [items, selectedFilters]);

  const calendarDays = currentMonthDays.map((interval) => {
    const dateKey = interval.start.toISO();

    return {
      date: interval.start,
      isCurrentMonth: interval.start.hasSame(selectedDate, "month"),
      items: filteredItems[dateKey] ?? [],
      dateKey,
    };
  });

  function renderMobileCalendar() {
    const visibleMonthDays = calendarDays.filter(
      (day) => day.isCurrentMonth && day.items.length > 0,
    );

    if (visibleMonthDays.length === 0) {
      return (
        <div className="border-border bg-background/40 text-muted-foreground rounded-md border border-dashed p-8 text-center">
          No releases match the current filters for this month.
        </div>
      );
    }

    return (
      <ul className="space-y-2">
        {visibleMonthDays.map((day) => (
          <CalendarMobileDayCard
            key={day.dateKey}
            day={day}
            isToday={isToday(day.date)}
          />
        ))}
      </ul>
    );
  }

  function renderDesktopCalendar() {
    return (
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
            isToday={isToday(day.date)}
          />
        ))}
      </div>
    );
  }

  return (
    <>
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
      <section
        role="grid"
        className="border-border/60 bg-card/30 overflow-hidden rounded-md border"
      >
        <div className="p-2 md:p-3">
          {shouldRenderMobileCalendar
            ? renderMobileCalendar()
            : renderDesktopCalendar()}
        </div>
      </section>
    </>
  );
}
