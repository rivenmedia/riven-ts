import { Calendar } from "@/components/calendar/calendar/calendar";
import { PageShell } from "@/components/page-shell/page-shell";

import type { EntertainmentItemData } from "@/components/calendar/types";

interface CalendarPageProps {
  calendar: {
    data: EntertainmentItemData[];
  };
}

export function CalendarPage({ calendar }: CalendarPageProps) {
  return (
    <PageShell className="mx-auto h-full w-full max-w-450 gap-5">
      <Calendar items={calendar.data} />
    </PageShell>
  );
}
