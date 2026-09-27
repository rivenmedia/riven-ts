import { preview } from "@/.storybook/preview";

import { DateTime } from "luxon";

import { CalendarDayCell } from "./calendar-day-cell";

import type { CalendarDay } from "../types";
import type { UUID } from "node:crypto";

const busyDay: CalendarDay = {
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
    {
      itemId: crypto.randomUUID() as UUID,
      tvdbId: "371572",
      tmdbId: "94605",
      showTitle: "Arcane",
      itemType: "show",
      airedAt: "2024-06-12",
    },
    {
      itemId: crypto.randomUUID() as UUID,
      tvdbId: "82856",
      tmdbId: "1418",
      showTitle: "The Big Bang Theory",
      itemType: "episode",
      airedAt: "2024-06-12",
      season: 5,
      episode: 12,
    },
  ],
};

const emptyDay: CalendarDay = {
  date: DateTime.local(2024, 6, 15),
  dateKey: "2024-06-15",
  isCurrentMonth: true,
  items: [],
};

const outsideMonthDay: CalendarDay = {
  ...emptyDay,
  date: DateTime.local(2024, 5, 30),
  dateKey: "2024-05-30",
  isCurrentMonth: false,
};

const meta = preview.meta({
  title: "Calendar / CalendarDayCell",
  component: CalendarDayCell,
  decorators: [
    (Story) => (
      <div className="w-40">
        <Story />
      </div>
    ),
  ],
});

export const Default = meta.story({
  args: {
    day: busyDay,
    isToday: false,
  },
});

export const Today = meta.story({
  args: {
    day: busyDay,
    isToday: true,
  },
});

export const Empty = meta.story({
  args: {
    day: emptyDay,
    isToday: false,
  },
});

export const OutsideMonth = meta.story({
  args: {
    day: outsideMonthDay,
    isToday: false,
  },
});
