import { preview } from "@/.storybook/preview";

import { CalendarDate } from "@internationalized/date";

import { DayItemsList } from "./day-items-list";

import type { CalendarDay } from "../types";

const day: CalendarDay = {
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

const emptyDay: CalendarDay = { ...day, items: [] };

const meta = preview.meta({
  title: "Calendar / DayItemsList",
  component: DayItemsList,
});

export const Default = meta.story({
  args: { day },
});

export const WithOverflow = meta.story({
  render: () => (
    <div className="w-64">
      <DayItemsList day={day} limit={2} showMore />
    </div>
  ),
});

export const Empty = meta.story({
  args: { day: emptyDay },
});
