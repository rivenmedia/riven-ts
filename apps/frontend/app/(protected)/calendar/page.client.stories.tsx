import { preview } from "@/.storybook/preview";

import { DateTime } from "luxon";

import { CalendarPage } from "./page.client";

import type { UUID } from "node:crypto";

const meta = preview.meta({
  title: "Pages / Calendar",
  component: CalendarPage,
  args: {
    calendar: {
      data: [
        {
          itemId: "1" as UUID,
          tvdbId: "1",
          tmdbId: "94605",
          showTitle: "Arcane",
          itemType: "episode" as const,
          airedAt: DateTime.now().toISO(),
          season: 2,
          episode: 3,
          lastState: "Completed",
        },
        {
          itemId: "2" as UUID,
          tvdbId: "2",
          tmdbId: "603692",
          showTitle: "John Wick: Chapter 4",
          itemType: "movie" as const,
          airedAt: DateTime.now().plus({ days: 2 }).toISO(),
          lastState: "Completed",
        },
        {
          itemId: "3" as UUID,
          tvdbId: "3",
          tmdbId: "1399",
          showTitle: "Game of Thrones",
          itemType: "show" as const,
          airedAt: DateTime.now().minus({ months: 1 }).toISO(),
          lastState: "Completed",
        },
      ],
    },
  },
});

export const WithReleases = meta.story();
