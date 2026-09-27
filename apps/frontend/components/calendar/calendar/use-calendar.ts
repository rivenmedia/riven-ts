import { DateTime, Info, Interval, Settings } from "luxon";
import { useEffect, useMemo, useState } from "react";

export function useCalendar() {
  const today = DateTime.local();
  const currentMonth = today.startOf("month", { useLocaleWeeks: true });

  const [selectedMonth, setSelectedMonth] = useState(currentMonth);

  useEffect(() => {
    setSelectedMonth(selectedMonth.setLocale(Settings.defaultLocale));
  }, [Settings.defaultLocale]);

  const endOfMonth = selectedMonth.endOf("month", { useLocaleWeeks: true });

  const intervalEnd = DateTime.max(
    endOfMonth,
    endOfMonth.endOf("week", { useLocaleWeeks: true }),
  );

  const currentMonthDays = Interval.fromDateTimes(
    selectedMonth.startOf("week", { useLocaleWeeks: true }),
    intervalEnd,
  ).splitBy({ days: 1 });

  function isToday(date: DateTime) {
    return date.hasSame(today, "day");
  }

  function isCurrentMonth(date: DateTime) {
    return date.hasSame(selectedMonth, "month");
  }

  const dayNames = useMemo(() => {
    const names = Info.weekdays("short");
    const startOfWeek = Info.getStartOfWeek();

    return [
      ...names.slice(startOfWeek - 1),
      ...names.slice(0, startOfWeek - 1),
    ];
  }, [Settings.defaultLocale]);

  function resetToToday() {
    setSelectedMonth(currentMonth);
  }

  return {
    selectedMonth,
    setSelectedMonth,
    dayNames,
    currentMonthDays,
    isToday,
    isCurrentMonth,
    resetToToday,
  };
}
