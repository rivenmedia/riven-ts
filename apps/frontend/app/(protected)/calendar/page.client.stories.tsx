import { UUID } from "@repo/util-plugin-sdk/schemas/utilities/uuid.schema";

import { DateTime } from "luxon";

import { preview } from "#.storybook/preview.tsx";
import { CalendarPage } from "#app/(protected)/calendar/page.client.tsx";

const meta = preview.meta({
  title: "Pages / Calendar",
  component: CalendarPage,
  args: {
    calendar: {
      data: [
        {
          id: UUID.parse(crypto.randomUUID()),
          primaryExternalId: "94605",
          fullTitle: "Arcane - S02E03 - Finally Got the Name Right",
          type: "episode" as const,
          releaseDate: DateTime.now().toISO(),
          seasonNumber: 2,
          number: 3,
          state: "completed" as const,
        },
        {
          id: UUID.parse(crypto.randomUUID()),
          primaryExternalId: "603692",
          fullTitle: "John Wick: Chapter 4",
          type: "movie" as const,
          releaseDate: DateTime.now().plus({ days: 2 }).toISO(),
          state: "completed" as const,
        },
        {
          id: UUID.parse(crypto.randomUUID()),
          primaryExternalId: "1399",
          fullTitle: "Game of Thrones",
          type: "show" as const,
          releaseDate: DateTime.now().minus({ months: 1 }).toISO(),
          state: "completed" as const,
        },
      ],
    },
  },
});

export const WithReleases = meta.story();
