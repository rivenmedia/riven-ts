import { UUID } from "@repo/util-plugin-sdk/schemas/utilities/uuid.schema";

import { DateTime } from "luxon";

import { preview } from "#.storybook/preview.tsx";
import { CalendarDayCell } from "#components/calendar/calendar-day-cell/calendar-day-cell.tsx";

import type { CalendarDay } from "#components/calendar/types.d.ts";

const busyDay: CalendarDay = {
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
    {
      id: UUID.parse(crypto.randomUUID()),
      primaryExternalId: "371572",
      title: "Arcane",
      type: "show",
      releaseDate: "2024-06-12",
      state: "completed",
    },
    {
      id: UUID.parse(crypto.randomUUID()),
      primaryExternalId: "82856",
      title: "The Big Bang Theory",
      type: "episode",
      releaseDate: "2024-06-12",
      seasonNumber: 5,
      number: 12,
      state: "completed",
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
