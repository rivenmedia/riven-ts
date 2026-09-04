import { preview } from "@/.storybook/preview";

import { DateTime, Settings } from "luxon";
import { expect, within } from "storybook/test";

import { Calendar } from "./calendar";

import type { UUID } from "node:crypto";

const meta = preview.meta({
  title: "Calendar / Calendar",
  component: Calendar,
  args: {
    items: [
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
  beforeEach() {
    const now = DateTime.fromObject({ year: 2026, month: 9, day: 4 });

    Settings.now = () => now.toMillis();
  },
});

export const Default = meta.story();

Default.test(
  "Navigates to the previous month when the 'Previous Month' button is clicked",
  async ({ canvas, userEvent }) => {
    const previousMonthButton = canvas.getByRole("button", {
      name: /previous month/iu,
    });

    await userEvent.click(previousMonthButton);

    const activeMonthHeading = await canvas.findByRole("heading", {
      level: 1,
      name: /august 2026/iu,
    });

    await expect(activeMonthHeading).toBeInTheDocument();
  },
);

Default.test(
  "Navigates to the next month when the 'Next Month' button is clicked",
  async ({ canvas, userEvent }) => {
    const nextMonthButton = canvas.getByRole("button", {
      name: /next month/iu,
    });

    await userEvent.click(nextMonthButton);

    const activeMonthHeading = await canvas.findByRole("heading", {
      level: 1,
      name: /october 2026/iu,
    });

    await expect(activeMonthHeading).toBeInTheDocument();
  },
);

export const Desktop = meta.story({
  globals: {
    viewport: {
      value: "desktop",
    },
  },
});

Desktop.test(
  "Toggles the visibility of calendar items when filters are applied",
  async ({ canvas, userEvent }) => {
    const episodeFilterCheckbox = canvas.getByRole("checkbox", {
      name: /episodes/iu,
    });

    const currentDateCell = await canvas.findByRole("gridcell", {
      current: "date",
    });

    await userEvent.click(episodeFilterCheckbox);

    await expect(within(currentDateCell).queryAllByRole("link")).toHaveLength(
      0,
    );

    await userEvent.click(episodeFilterCheckbox);

    await expect(within(currentDateCell).queryAllByRole("link")).toHaveLength(
      1,
    );
  },
);

export const Mobile = meta.story({
  globals: {
    viewport: {
      value: "mobile",
    },
  },
});

Mobile.test(
  "Toggles the visibility of calendar items when filters are applied",
  async ({ canvas, userEvent }) => {
    const episodeFilterCheckbox = canvas.getByRole("checkbox", {
      name: /episodes/iu,
    });

    await userEvent.click(episodeFilterCheckbox);

    await expect(
      canvas.queryByRole("listitem", {
        current: "date",
      }),
    ).not.toBeInTheDocument();

    await userEvent.click(episodeFilterCheckbox);

    await expect(
      canvas.queryByRole("listitem", {
        current: "date",
      }),
    ).toBeInTheDocument();
  },
);
