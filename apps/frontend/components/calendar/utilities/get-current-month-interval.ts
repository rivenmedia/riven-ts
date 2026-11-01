import { Interval, DateTime } from "luxon";

export function getCurrentMonthInterval(selectedMonth: DateTime) {
  const endOfMonth = selectedMonth.endOf("month", { useLocaleWeeks: true });
  const intervalEnd = DateTime.max(
    endOfMonth,
    endOfMonth.endOf("week", { useLocaleWeeks: true }),
  );

  return Interval.fromDateTimes(
    selectedMonth
      .startOf("month", { useLocaleWeeks: true })
      .startOf("week", { useLocaleWeeks: true }),
    intervalEnd,
  );
}
