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
        airedAt: DateTime.fromObject({ year: 2026, month: 9, day: 4 }).toISO(),
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
        airedAt: DateTime.fromObject({ year: 2026, month: 9, day: 6 }).toISO(),
        lastState: "Completed",
      },
      {
        itemId: "3" as UUID,
        tvdbId: "3",
        tmdbId: "1399",
        showTitle: "Game of Thrones",
        itemType: "show" as const,
        airedAt: DateTime.fromObject({ year: 2026, month: 8, day: 4 }).toISO(),
        lastState: "Completed",
      },
    ],
  },
  beforeEach() {
    const now = DateTime.fromObject({
      year: 2026,
      month: 9,
      day: 4,
    });

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

    await expect(
      await within(currentDateCell).findAllByRole("link"),
    ).toHaveLength(1);

    await userEvent.click(episodeFilterCheckbox);

    await expect(within(currentDateCell).queryAllByRole("link")).toHaveLength(
      0,
    );

    await userEvent.click(episodeFilterCheckbox);

    await expect(
      await within(currentDateCell).findAllByRole("link"),
    ).toHaveLength(1);
  },
);

Desktop.test(
  "Adjusts the calendar based on the current locale",
  {
    afterEach() {
      Settings.resetCaches();
    },
  },
  async ({ canvas, userEvent, step }) => {
    const filterButton = canvas.getByRole("checkbox", {
      name: /episodes/iu,
    });

    const testCases = [
      {
        locale: "en-GB",
        expectedMonthResults: [
          {
            datetime: DateTime.fromObject({ year: 2026, month: 8 }),
            expectedDayCells: 42,
            firstDayDatetime: DateTime.fromObject({
              year: 2026,
              month: 7,
              day: 27,
            }),
          },
          {
            datetime: DateTime.fromObject({ year: 2026, month: 9 }),
            expectedDayCells: 35,
            firstDayDatetime: DateTime.fromObject({
              year: 2026,
              month: 8,
              day: 31,
            }),
          },
          {
            datetime: DateTime.fromObject({ year: 2026, month: 10 }),
            expectedDayCells: 35,
            firstDayDatetime: DateTime.fromObject({
              year: 2026,
              month: 9,
              day: 28,
            }),
          },
          {
            datetime: DateTime.fromObject({ year: 2026, month: 11 }),
            expectedDayCells: 42,
            firstDayDatetime: DateTime.fromObject({
              year: 2026,
              month: 10,
              day: 26,
            }),
          },
          {
            datetime: DateTime.fromObject({ year: 2026, month: 12 }),
            expectedDayCells: 35,
            firstDayDatetime: DateTime.fromObject({
              year: 2026,
              month: 11,
              day: 30,
            }),
          },
          {
            datetime: DateTime.fromObject({ year: 2027, month: 1 }),
            expectedDayCells: 35,
            firstDayDatetime: DateTime.fromObject({
              year: 2026,
              month: 12,
              day: 28,
            }),
          },
        ],
        expectedDayHeaders: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      },
      {
        locale: "en-US",
        expectedMonthResults: [
          {
            datetime: DateTime.fromObject({ year: 2026, month: 8 }),
            expectedDayCells: 42,
            firstDayDatetime: DateTime.fromObject({
              year: 2026,
              month: 7,
              day: 26,
            }),
          },
          {
            datetime: DateTime.fromObject({ year: 2026, month: 9 }),
            expectedDayCells: 35,
            firstDayDatetime: DateTime.fromObject({
              year: 2026,
              month: 8,
              day: 30,
            }),
          },
          {
            datetime: DateTime.fromObject({ year: 2026, month: 10 }),
            expectedDayCells: 35,
            firstDayDatetime: DateTime.fromObject({
              year: 2026,
              month: 9,
              day: 27,
            }),
          },
          {
            datetime: DateTime.fromObject({ year: 2026, month: 11 }),
            expectedDayCells: 35,
            firstDayDatetime: DateTime.fromObject({
              year: 2026,
              month: 11,
              day: 1,
            }),
          },
          {
            datetime: DateTime.fromObject({ year: 2026, month: 12 }),
            expectedDayCells: 35,
            firstDayDatetime: DateTime.fromObject({
              year: 2026,
              month: 11,
              day: 29,
            }),
          },
          {
            datetime: DateTime.fromObject({ year: 2027, month: 1 }),
            expectedDayCells: 42,
            firstDayDatetime: DateTime.fromObject({
              year: 2026,
              month: 12,
              day: 27,
            }),
          },
        ],
        expectedDayHeaders: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
      },
      {
        locale: "fa-IR",
        expectedMonthResults: [
          {
            datetime: DateTime.fromObject({ year: 2026, month: 8 }),
            expectedDayCells: 35,
            firstDayDatetime: DateTime.fromObject({
              year: 2026,
              month: 8,
              day: 1,
            }),
          },
          {
            datetime: DateTime.fromObject({ year: 2026, month: 9 }),
            expectedDayCells: 35,
            firstDayDatetime: DateTime.fromObject({
              year: 2026,
              month: 8,
              day: 29,
            }),
          },
          {
            datetime: DateTime.fromObject({ year: 2026, month: 10 }),
            expectedDayCells: 42,
            firstDayDatetime: DateTime.fromObject({
              year: 2026,
              month: 9,
              day: 26,
            }),
          },
          {
            datetime: DateTime.fromObject({ year: 2026, month: 11 }),
            expectedDayCells: 35,
            firstDayDatetime: DateTime.fromObject({
              year: 2026,
              month: 10,
              day: 31,
            }),
          },
          {
            datetime: DateTime.fromObject({ year: 2026, month: 12 }),
            expectedDayCells: 35,
            firstDayDatetime: DateTime.fromObject({
              year: 2026,
              month: 11,
              day: 28,
            }),
          },
          {
            datetime: DateTime.fromObject({ year: 2027, month: 1 }),
            expectedDayCells: 42,
            firstDayDatetime: DateTime.fromObject({
              year: 2026,
              month: 12,
              day: 26,
            }),
          },
        ],
        expectedDayHeaders: [
          "شنبه",
          "یکشنبه",
          "دوشنبه",
          "سه‌شنبه",
          "چهارشنبه",
          "پنجشنبه",
          "جمعه",
        ],
      },
    ] as const;

    for (const testCase of testCases) {
      await step(testCase.locale, async () => {
        Settings.defaultLocale = testCase.locale;

        await userEvent.dblClick(filterButton); // Force a re-render after updating the locale

        await step(
          `Verify day headers match the expected order (${testCase.expectedDayHeaders.toString()})`,
          async () => {
            const dayHeaders = await canvas.findAllByRole("columnheader");

            for (let i = 0; i < dayHeaders.length; i++) {
              const expectedDayHeader = testCase.expectedDayHeaders[i];

              if (expectedDayHeader == null) {
                throw new Error("Expected day header is missing");
              }

              await expect(dayHeaders[i]).toHaveTextContent(expectedDayHeader);
            }
          },
        );

        const previousMonthButton = await canvas.findByRole("button", {
          name: /previous month/iu,
        });

        const todayButton = canvas.getByRole("button", {
          name: /today/iu,
        });

        await userEvent.click(todayButton);

        await userEvent.click(previousMonthButton);

        const nextMonthButton = await canvas.findByRole("button", {
          name: /next month/iu,
        });

        for (const {
          datetime,
          expectedDayCells,
          firstDayDatetime,
        } of testCase.expectedMonthResults) {
          await step(
            `Verify month: ${datetime.toFormat("LLLL yyyy")}`,
            async () => {
              const dayCells = await canvas.findAllByRole("gridcell");

              await step(
                `Verify there are ${expectedDayCells.toString()} day cells`,
                async () => {
                  await expect(dayCells).toHaveLength(expectedDayCells);
                },
              );

              const expectedAccessibleName = firstDayDatetime
                .setLocale(testCase.locale)
                .toLocaleString(DateTime.DATE_FULL);

              await step(
                `Verify the first day cell is "${expectedAccessibleName}"`,
                async () => {
                  await expect(dayCells[0]).toHaveAccessibleName(
                    expectedAccessibleName,
                  );
                },
              );

              await userEvent.click(nextMonthButton);
            },
          );
        }
      });
    }
  },
);

export const Mobile = meta.story({
  globals: {
    viewport: {
      value: "mobile1",
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
      await canvas.findByRole("listitem", {
        current: "date",
      }),
    ).toBeInTheDocument();
  },
);
