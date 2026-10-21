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
          itemId: UUID.parse(crypto.randomUUID()),
          tvdbId: "",
          tmdbId: "603692",
          showTitle: "John Wick: Chapter 4",
          itemType: "movie",
          airedAt: "2024-06-12",
        },
        {
          itemId: UUID.parse(crypto.randomUUID()),
          tvdbId: "121361",
          tmdbId: "1399",
          showTitle: "Game of Thrones",
          itemType: "episode",
          airedAt: "2024-06-12",
          season: 8,
          episode: 1,
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
