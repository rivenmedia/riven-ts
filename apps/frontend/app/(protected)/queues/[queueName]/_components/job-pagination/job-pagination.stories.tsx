import { expect } from "storybook/test";

import { preview } from "#.storybook/preview.tsx";

import { getJobs } from "../../../_data/queue-data.ts";
import { JobPagination } from "./job-pagination.tsx";

const meta = preview.meta({
  title: "Pages / Queues / Components / JobPagination",
  component: JobPagination,
  args: { queueName: "scrape-item", state: "completed", locale: "en-GB" },
});

export const MiddlePage = meta.story({
  args: { jobPage: getJobs("scrape-item", "completed", 2) },
});

MiddlePage.test("Shows the range and links both ways", async ({ canvas }) => {
  await expect(canvas.getByText("Showing 26–50 of 6,930")).toBeVisible();
  await expect(canvas.getByRole("link", { name: /Previous/u })).toHaveAttribute(
    "href",
    "/queues/scrape-item?state=completed",
  );
  await expect(canvas.getByRole("link", { name: /Next/u })).toHaveAttribute(
    "href",
    "/queues/scrape-item?state=completed&page=3",
  );
});

export const OnlyPage = meta.story({
  args: { state: "active", jobPage: getJobs("scrape-item", "active", 1) },
});

OnlyPage.test("Turns Previous and Next off", async ({ canvas }) => {
  await expect(canvas.getByText("Showing 1–3 of 3")).toBeVisible();
  await expect(
    canvas.getByRole("button", { name: /Previous/u }),
  ).toBeDisabled();
  await expect(canvas.getByRole("button", { name: /Next/u })).toBeDisabled();
});

export const NoJobs = meta.story({
  args: { state: "paused", jobPage: getJobs("scrape-item", "paused", 1) },
});

NoJobs.test("Shows an empty range", async ({ canvas }) => {
  await expect(canvas.getByText("Showing 0 of 0")).toBeVisible();
});
