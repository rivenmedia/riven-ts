import { preview } from "@/.storybook/preview";

import { DateTime } from "luxon";

import { CalendarMobileDayCard } from "./calendar-mobile-day-card";

import type { CalendarDay } from "../types";
import type { UUID } from "node:crypto";

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
          itemId: crypto.randomUUID() as UUID,
          tvdbId: "",
          tmdbId: "603692",
          showTitle: "John Wick: Chapter 4",
          itemType: "movie",
          airedAt: "2024-06-12",
        },
        {
          itemId: crypto.randomUUID() as UUID,
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
