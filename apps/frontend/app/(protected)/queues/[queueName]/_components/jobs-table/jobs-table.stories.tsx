import { expect, fn } from "storybook/test";

import { preview } from "#.storybook/preview.tsx";

import { getJobs } from "../../../_data/queue-data.ts";
import { FIXTURE_NOW } from "../../../_fixtures/jobs.fixture.ts";
import { jobHref } from "../../../_utilities/queue-routes.ts";
import { JobsTable } from "./jobs-table.tsx";

import type { JobState } from "../../../_utilities/job-states.ts";

const processMediaItemJobs = (state: JobState) =>
  getJobs("process-media-item", state, 1).jobs;

const meta = preview.meta({
  component: JobsTable,
  args: {
    jobs: processMediaItemJobs("waiting"),
    state: "waiting",
    now: FIXTURE_NOW,
    locale: "en-GB",
    selectedIds: new Set<string>(),
    onSelectedIdsChange: fn(),
  },
});

const columnHeaders = (canvas: {
  getAllByRole: (role: string) => HTMLElement[];
}) =>
  canvas
    .getAllByRole("columnheader")
    .map((header) => header.textContent)
    .filter(Boolean);

export const Waiting = meta.story();

Waiting.test(
  "shows when each job was created and how long it waited",
  async ({ canvas }) => {
    await expect(columnHeaders(canvas)).toEqual([
      "Job",
      "Media item",
      "Attempts",
      "Created",
      "Waiting for",
    ]);
  },
);

export const Prioritized = meta.story({
  args: { jobs: processMediaItemJobs("prioritized"), state: "prioritized" },
});

export const WaitingChildren = meta.story({
  args: {
    jobs: processMediaItemJobs("waiting-children"),
    state: "waiting-children",
  },
});

WaitingChildren.test("reads the child progress", async ({ canvas }) => {
  await expect(canvas.getAllByText(/ of \d+ done$/u).length).toBeGreaterThan(0);
});

export const Active = meta.story({
  args: { jobs: processMediaItemJobs("active"), state: "active" },
});

Active.test("has no checkboxes", async ({ canvas }) => {
  await expect(canvas.queryAllByRole("checkbox")).toHaveLength(0);
  await expect(canvas.getAllByText(/^\d+%$/u).length).toBeGreaterThan(0);
});

export const Delayed = meta.story({
  args: { jobs: getJobs("scrape-item", "delayed", 1).jobs, state: "delayed" },
});

Delayed.test(
  "labels the reasons without saying delayed",
  async ({ canvas }) => {
    await expect(
      canvas.getAllByText(/^(Retry backoff|Scheduled)$/u).length,
    ).toBeGreaterThan(0);
    await expect(canvas.queryByText(/delayed/iu)).not.toBeInTheDocument();
  },
);

export const Failed = meta.story({
  args: { jobs: processMediaItemJobs("failed"), state: "failed" },
});

Failed.test("shows the failure columns", async ({ canvas }) => {
  await expect(columnHeaders(canvas)).toEqual([
    "Job",
    "Media item",
    "Attempts",
    "Failure reason",
    "Failed",
    "Duration",
  ]);
});

Failed.test("opens jobs in a new tab", async ({ canvas }) => {
  const link = canvas.getByRole("link", {
    name: "Job 49012 (opens in a new tab)",
  });

  await expect(link).toHaveAttribute("target", "_blank");
  await expect(link).toHaveAttribute(
    "rel",
    expect.stringContaining("noopener"),
  );
});

Failed.test("selects only top-level jobs", async ({ canvas }) => {
  const labels = canvas
    .getAllByRole("checkbox")
    .map((box) => box.getAttribute("aria-label"));

  await expect(labels).toEqual([
    "Select all 4 top-level jobs on this page",
    "Select job 49012",
    "Select job 48702",
    "Select job 48655",
    "Select job 48302",
  ]);
  await expect(
    canvas.queryByRole("checkbox", { name: "Select job 48998" }),
  ).not.toBeInTheDocument();
});

Failed.test("names the flow a child job belongs to", async ({ canvas }) => {
  const parent = canvas.getByRole("link", {
    name: "process-item-request #48960",
  });

  await expect(parent.parentElement).toHaveTextContent(
    "In flow under process-item-request #48960",
  );
  await expect(parent).toHaveAttribute(
    "href",
    jobHref("process-item-request", "48960"),
  );
});

export const Completed = meta.story({
  args: { jobs: processMediaItemJobs("completed"), state: "completed" },
});

export const Paused = meta.story({
  args: {
    jobs: getJobs("request-subtitles", "paused", 1).jobs,
    state: "paused",
  },
});

export const ChildJobsOnly = meta.story({
  args: { jobs: getJobs("scrape-item", "failed", 1).jobs, state: "failed" },
});

ChildJobsOnly.test("has no checkboxes at all", async ({ canvas }) => {
  await expect(canvas.queryAllByRole("checkbox")).toHaveLength(0);
});

export const Empty = meta.story({
  args: { jobs: [], state: "waiting-children" },
});

Empty.test("explains that there are no jobs", async ({ canvas }) => {
  await expect(canvas.getByText("No jobs are awaiting children")).toBeVisible();
});

export const SelectedSome = meta.story({
  args: {
    jobs: processMediaItemJobs("failed"),
    state: "failed",
    selectedIds: new Set(["49012"]),
  },
});

SelectedSome.test(
  "selects and clears from the header",
  async ({ canvas, userEvent, args }) => {
    const header = canvas.getByRole("checkbox", {
      name: "Select all 4 top-level jobs on this page",
    });

    await expect(header).toHaveAttribute("aria-checked", "mixed");
    await expect(
      canvas.getByRole("checkbox", { name: "Select job 49012" }),
    ).toBeChecked();

    await userEvent.click(header);

    await expect(args.onSelectedIdsChange).toHaveBeenCalledWith(
      new Set(["49012", "48702", "48655", "48302"]),
    );
  },
);

SelectedSome.test(
  "adds a row to the selection",
  async ({ canvas, userEvent, args }) => {
    await userEvent.click(
      canvas.getByRole("checkbox", { name: "Select job 48702" }),
    );

    await expect(args.onSelectedIdsChange).toHaveBeenCalledWith(
      new Set(["49012", "48702"]),
    );
  },
);

export const AllSelected = meta.story({
  args: {
    jobs: processMediaItemJobs("failed"),
    state: "failed",
    selectedIds: new Set(["49012", "48702", "48655", "48302"]),
  },
});

AllSelected.test(
  "clears the selection from the header",
  async ({ canvas, userEvent, args }) => {
    await userEvent.click(
      canvas.getByRole("checkbox", {
        name: "Select all 4 top-level jobs on this page",
      }),
    );

    await expect(args.onSelectedIdsChange).toHaveBeenCalledWith(new Set());
  },
);
