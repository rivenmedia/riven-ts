import { UUID } from "@repo/util-plugin-sdk/schemas/utilities/uuid.schema";

import { DateTime } from "luxon";

import { preview } from "#.storybook/preview.tsx";
import { CalendarMobileDayCard } from "#components/calendar/calendar-mobile-day-card/calendar-mobile-day-card.tsx";

import type { CalendarDay } from "#components/calendar/types.d.ts";

const meta = preview.meta({
  title: "Calendar / CalendarMobileDayCard",
  component: CalendarMobileDayCard,
  args: {
    day: {
      date: DateTime.local(2024, 6, 12),
      dateKey: "2024-06-12",
      isCurrentMonth: true,
      items: [
        {
          id: UUID.parse(crypto.randomUUID()),
          primaryExternalId: "603692",
          title: "John Wick: Chapter 4",
          type: "movie",
          releaseDate: "2024-06-12",
          state: "completed",
        },
        {
          id: UUID.parse(crypto.randomUUID()),
          primaryExternalId: "121361",
          title: "Game of Thrones",
          type: "episode",
          releaseDate: "2024-06-12",
          seasonNumber: 8,
          number: 1,
          state: "completed",
        },
      ],
    } satisfies CalendarDay,
  },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
});

export const Default = meta.story({
  args: {
    isToday: false,
  },
});

export const Today = meta.story({
  args: {
    isToday: true,
  },
});
