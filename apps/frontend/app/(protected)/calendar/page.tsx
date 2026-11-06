import { DateTime } from "luxon";
import { headers } from "next/headers";
import { z } from "zod";

import { getCurrentMonthInterval } from "#components/calendar/utilities/get-current-month-interval.ts";
import { query } from "#lib/graphql/client.ts";
import { resolveLocale } from "#lib/utils/resolve-locale.ts";

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

export default async function CalendarPage({
  searchParams,
}: PageProps<"/calendar">) {
  const headersList = await headers();
  const acceptLanguage = headersList.get("accept-language");
  const locale = resolveLocale(acceptLanguage);
  const now = DateTime.local({ locale });

  const { month, year } = z
    .object({
      month: z.coerce.number().int().min(1).max(12).prefault(now.month),
      year: z.coerce.number().int().prefault(now.year),
    })
    .parse(await searchParams);

  const { start, end } = getCurrentMonthInterval(
    DateTime.fromObject({ month, year }).setLocale(locale),
  );

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
        month: { month, year },
      }}
    />
  );
}
