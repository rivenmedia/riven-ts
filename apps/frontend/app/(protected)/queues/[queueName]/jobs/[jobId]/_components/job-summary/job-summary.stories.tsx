import { expect } from "storybook/test";

import { preview } from "#.storybook/preview.tsx";

import { getJob, getJobs } from "../../../../../_data/queue-data.ts";
import { FIXTURE_NOW } from "../../../../../_fixtures/jobs.fixture.ts";
import { JobSummary } from "./job-summary.tsx";

const failed = getJob("scrape-item", "48213");
const activeId = getJobs("process-item-request", "active", 1).jobs[0]?.id;
const active = activeId ? getJob("process-item-request", activeId) : undefined;

if (!failed || !active) {
  throw new Error("Missing fixture jobs");
}

const meta = preview.meta({
  component: JobSummary,
  args: { job: failed, now: FIXTURE_NOW, locale: "en-GB" },
});

export const Failed = meta.story();

Failed.test("lists the job's details", async ({ canvas }) => {
  await expect(canvas.getByText("Severance S02E07")).toBeVisible();
  await expect(canvas.getByText("3 of 3")).toBeVisible();
  await expect(canvas.getByText("32.4 s")).toBeVisible();
  await expect(
    canvas.getByRole("link", { name: "process-media-item #48190" }),
  ).toBeVisible();
  await expect(canvas.queryByText("Progress")).toBeNull();
});

export const Active = meta.story({ args: { job: active } });

Active.test("shows progress and no finish time", async ({ canvas }) => {
  await expect(canvas.getByText("Progress")).toBeVisible();
  await expect(canvas.getByText("Not yet")).toBeVisible();
});
