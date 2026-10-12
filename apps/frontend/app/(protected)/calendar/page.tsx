import { CalendarPage as CalendarPageClient } from "./page.client";

export default function CalendarPage() {
  return (
    <CalendarPageClient
      calendar={{
        data: [],
      }}
    />
  );
}
