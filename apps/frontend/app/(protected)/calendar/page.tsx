import { DateTime } from "luxon";
import { io } from "next/cache";

import { getCurrentMonthInterval } from "#components/calendar/utilities/get-current-month-interval.ts";
import { query } from "#lib/graphql/client.ts";

import { GET_CALENDAR_DATA } from "./_queries/get-calendar-data.query";
import { CalendarPage as CalendarPageClient } from "./page.client";

export default async function CalendarPage() {
  await io();

  const { start, end } = getCurrentMonthInterval(DateTime.now());
  const { data } = await query({
    query: GET_CALENDAR_DATA,
    variables: {
      from: start,
      to: end,
    },
  });

  return (
    <CalendarPageClient
      calendar={{
        data: data?.calendar ?? [],
      }}
    />
  );
}
