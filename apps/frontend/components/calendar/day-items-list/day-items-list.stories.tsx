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
      id: UUID.parse(crypto.randomUUID()),
      primaryExternalId: "603692",
      fullTitle: "John Wick: Chapter 4",
      type: "movie",
      releaseDate: "2024-06-12",
      state: "completed",
    },
    {
      id: UUID.parse(crypto.randomUUID()),
      primaryExternalId: "121361",
      fullTitle: "Game of Thrones - S08E01 - Winterfell",
      type: "episode",
      releaseDate: "2024-06-12",
      seasonNumber: 8,
      number: 1,
      state: "completed",
    },
    {
      id: UUID.parse(crypto.randomUUID()),
      primaryExternalId: "371572",
      fullTitle: "Arcane",
      type: "show",
      releaseDate: "2024-06-12",
      state: "completed",
    },
    {
      id: UUID.parse(crypto.randomUUID()),
      primaryExternalId: "82856",
      fullTitle: "The Big Bang Theory - S05E12 - The Shiny Trinket Maneuver",
      type: "episode",
      releaseDate: "2024-06-12",
      seasonNumber: 5,
      number: 12,
      state: "completed",
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
