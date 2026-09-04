import { DateTime, Interval } from "luxon";
import { useState } from "react";

export function useCalendar() {
  const today = DateTime.local({ locale: "en-US" });
  const currentMonth = today.startOf("month");

  const [selectedDate, setSelectedDate] = useState(currentMonth);

  const startOfWeek = today.startOf("week", { useLocaleWeeks: true });
  const endOfWeek = today.endOf("week", { useLocaleWeeks: true });

  const dayNames = Interval.fromDateTimes(startOfWeek, endOfWeek)
    .splitBy({ days: 1 })
    .map((interval) => interval.start.toFormat("ccc"));

  const currentMonthDays = DateTime.min(
    selectedDate.minus({ day: 1 }),
    startOfWeek,
  )
    .until(selectedDate.plus({ months: 1 }))
    .splitBy({ days: 1 });

  function isToday(date: DateTime) {
    return date.hasSame(today, "day");
  }

  return {
    selectedDate,
    setSelectedDate,
    dayNames,
    currentMonthDays,
    isToday,
  };
}
