import { preview } from "@/.storybook/preview";

import { CalendarDate } from "@internationalized/date";

import { CalendarDayCell } from "./calendar-day-cell";

import type { CalendarDay } from "../types";

const busyDay: CalendarDay = {
  date: new CalendarDate(2024, 6, 12),
  dateKey: "2024-06-12",
  isCurrentMonth: true,
  items: [
    {
      itemId: 1,
      tvdbId: "",
      tmdbId: "603692",
      showTitle: "John Wick: Chapter 4",
      itemType: "movie",
      airedAt: "2024-06-12",
    },
    {
      itemId: 2,
      tvdbId: "121361",
      tmdbId: "1399",
      showTitle: "Game of Thrones",
      itemType: "episode",
      airedAt: "2024-06-12",
      season: 8,
      episode: 1,
    },
    {
      itemId: 3,
      tvdbId: "371572",
      tmdbId: "94605",
      showTitle: "Arcane",
      itemType: "show",
      airedAt: "2024-06-12",
    },
    {
      itemId: 4,
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
  date: new CalendarDate(2024, 6, 15),
  dateKey: "2024-06-15",
  isCurrentMonth: true,
  items: [],
};

const outsideMonthDay: CalendarDay = {
  ...emptyDay,
  date: new CalendarDate(2024, 5, 30),
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
