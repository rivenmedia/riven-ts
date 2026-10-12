import { Calendar } from "#components/calendar/calendar/calendar.tsx";

import type { EntertainmentItemData } from "#components/calendar/types.d.ts";

interface CalendarPageProps {
  calendar: {
    data: EntertainmentItemData[];
  };
}

export function CalendarPage({ calendar }: CalendarPageProps) {
  return <Calendar items={calendar.data} />;
}
