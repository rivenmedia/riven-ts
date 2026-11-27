import { expect } from "storybook/test";

import { preview } from "#.storybook/preview.tsx";

import { JobDataTabs } from "./job-data-tabs.tsx";

const meta = preview.meta({
  title: "Pages / Queues / Components / JobDataTabs",
  component: JobDataTabs,
  args: {
    data: { step: "scrape", isRootItem: false },
    state: "failed",
  },
});

export const Failed = meta.story();

Failed.test("Shows the input data first", async ({ canvas }) => {
  await expect(canvas.getByRole("tab", { name: "Input data" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await expect(canvas.getByText(/"step": "scrape"/u)).toBeVisible();
});

Failed.test(
  "Says a failed job has no return value",
  async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("tab", { name: "Return value" }));

    await expect(
      canvas.getByText("No return value. The job failed before it finished."),
    ).toBeVisible();
  },
);

export const Active = meta.story({ args: { state: "active" } });

Active.test(
  "Says an unfinished job has no return value",
  async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("tab", { name: "Return value" }));

    await expect(canvas.getByText("No return value.")).toBeVisible();
  },
);

export const CompletedJob = meta.story({
  args: { state: "completed", returnValue: { streams: 41 } },
});

CompletedJob.test(
  "Shows the return value as JSON",
  async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("tab", { name: "Return value" }));

    await expect(canvas.getByText(/"streams": 41/u)).toBeVisible();
  },
);
