import { expect } from "storybook/test";

import { preview } from "#.storybook/preview.tsx";

import { JobLogs } from "./job-logs.tsx";

const meta = preview.meta({
  component: JobLogs,
  args: {
    lines: [
      "13:49:52  Scraping Severance S02E07 with 2 plugins",
      "13:50:21  torrentio failed: request timed out after 30 s",
    ],
  },
});

export const Default = meta.story();

Default.test("counts and shows the lines", async ({ canvas }) => {
  await expect(canvas.getByText("2 lines")).toBeVisible();
  await expect(canvas.getByText(/Scraping Severance S02E07/u)).toBeVisible();
});

export const Empty = meta.story({ args: { lines: [] } });

Empty.test("says nothing was logged", async ({ canvas }) => {
  await expect(canvas.getByText("0 lines")).toBeVisible();
  await expect(
    canvas.getByText("This job hasn't logged anything."),
  ).toBeVisible();
});
