import { UUID } from "@repo/util-plugin-sdk/schemas/utilities/uuid.schema";

import { DateTime } from "luxon";

import { preview } from "#.storybook/preview.tsx";
import { DayItemsList } from "#components/calendar/day-items-list/day-items-list.tsx";

import type { CalendarDay } from "#components/calendar/types.d.ts";

const day: CalendarDay = {
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
    {
      itemId: UUID.parse(crypto.randomUUID()),
      tvdbId: "371572",
      tmdbId: "94605",
      showTitle: "Arcane",
      itemType: "show",
      airedAt: "2024-06-12",
    },
    {
      itemId: UUID.parse(crypto.randomUUID()),
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
