import { DateTime } from "luxon";
import { io } from "next/cache";

import { getCurrentMonthInterval } from "#components/calendar/utilities/get-current-month-interval.ts";
import { query } from "#lib/graphql/client.ts";

import { GET_CALENDAR_DATA } from "./_queries/get-calendar-data.query";
import { CalendarPage as CalendarPageClient } from "./page.client";

import type { EntertainmentItemData } from "#components/calendar/types.d.ts";
import type { GetCalendarDataQuery } from "./_queries/get-calendar-data.query.typegen";

function toEntertainmentItem(
  item: GetCalendarDataQuery["calendar"][number],
): EntertainmentItemData {
  switch (item.__typename) {
    case "Movie": {
      return { ...item, type: "movie" };
    }
    case "Show": {
      return { ...item, type: "show" };
    }
    case "Season": {
      return { ...item, type: "season" };
    }
    case "Episode": {
      return { ...item, type: "episode" };
    }
  }
}

export default async function CalendarPage() {
  await io();

  const { start, end } = getCurrentMonthInterval(DateTime.now());
  const { data } = await query({
    query: GET_CALENDAR_DATA,
    variables: {
      from: start.toISO(),
      to: end.toISO(),
    },
  });

  return (
    <CalendarPageClient
      calendar={{
        data: data?.calendar.map(toEntertainmentItem) ?? [],
      }}
    />
  );
}
