import { expect } from "storybook/test";

import { preview } from "#.storybook/preview.tsx";

import { LocalTime } from "./local-time.tsx";

const meta = preview.meta({
  title: "Pages / Queues / Components / LocalTime",
  component: LocalTime,
  args: {
    iso: "2026-11-26T13:49:51.000Z",
    locale: "en-GB",
    format: "date-time",
    fallback: "—",
  },
});

export const DateTime = meta.story();

DateTime.test("Shows the date and time in the browser", async ({ canvas }) => {
  const time = await canvas.findByText(/^\d{1,2} \w{3}, \d{2}:\d{2}:\d{2}$/u);

  await expect(time).toHaveAttribute("datetime", "2026-11-26T13:49:51.000Z");
});

export const Clock = meta.story({ args: { format: "clock" } });

Clock.test("Shows only the clock time", async ({ canvas }) => {
  const time = await canvas.findByText(/^\d{2}:\d{2}$/u);

  await expect(time).toHaveAttribute("datetime", "2026-11-26T13:49:51.000Z");
});
