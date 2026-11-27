import { expect } from "storybook/test";
import { INITIAL_VIEWPORTS } from "storybook/viewport";

import { preview } from "#.storybook/preview.tsx";

import { getJobs, getLiveStatus, getQueue } from "../_data/queue-data.ts";
import { FIXTURE_NOW } from "../_fixtures/jobs.fixture.ts";
import { QueuePage } from "./page.client.tsx";

import type { JobState } from "../_utilities/job-states.ts";

const props = (queueName: string, state: JobState) => {
  const queue = getQueue(queueName);

  if (!queue) {
    throw new Error(`Unknown fixture queue ${queueName}`);
  }

  return {
    queue,
    state,
    jobPage: getJobs(queueName, state, 1),
  };
};

const meta = preview.meta({
  component: QueuePage,
  args: {
    ...props("process-media-item", "failed"),
    liveStatus: getLiveStatus(),
    now: FIXTURE_NOW,
    locale: "en-GB",
  },
});

export const Failed = meta.story();

Failed.test("shows the queue and its failed jobs", async ({ canvas }) => {
  await expect(
    canvas.getByRole("heading", { name: "Process media item", level: 1 }),
  ).toBeVisible();
  await expect(canvas.getByText("process-media-item · flow")).toBeVisible();
  await expect(canvas.getByRole("link", { name: "Failed 7" })).toHaveAttribute(
    "aria-current",
    "page",
  );
  await expect(
    canvas.getByRole("checkbox", { name: "Select job 49012" }),
  ).toBeVisible();
  await expect(canvas.getByText("Showing 1–7 of 7")).toBeVisible();
});

Failed.test("selects jobs", async ({ canvas, userEvent }) => {
  await userEvent.click(
    canvas.getByRole("checkbox", { name: "Select job 49012" }),
  );

  await expect(
    canvas.getByRole("checkbox", { name: "Select job 49012" }),
  ).toBeChecked();
  await expect(
    canvas.getByRole("checkbox", {
      name: "Select all 4 top-level jobs on this page",
    }),
  ).toHaveAttribute("aria-checked", "mixed");
});

export const ChildJobsFailed = meta.story({
  args: props("scrape-item", "failed"),
});

ChildJobsFailed.test("has nothing to select", async ({ canvas }) => {
  await expect(
    canvas.getByRole("heading", { name: "Scrape item", level: 1 }),
  ).toBeVisible();
  await expect(canvas.queryAllByRole("checkbox")).toHaveLength(0);
});

export const PluginQueue = meta.story({
  args: props("riven.media-item.scrape.requested.plugin[torrentio]", "waiting"),
});

PluginQueue.test("uses the plugin queue's display name", async ({ canvas }) => {
  await expect(
    canvas.getByRole("heading", { name: "Scrape requested", level: 1 }),
  ).toBeVisible();
});

export const PausedQueue = meta.story({
  args: props("request-subtitles", "paused"),
});

PausedQueue.test("says the queue is paused", async ({ canvas }) => {
  await expect(canvas.getByText("Request subtitles is paused")).toBeVisible();
  await expect(
    canvas.getByRole("button", { name: "Resume queue" }),
  ).toBeEnabled();
});

export const Disconnected = meta.story({
  args: {
    ...props("request-subtitles", "paused"),
    liveStatus: {
      ...getLiveStatus(),
      connectionStatus: "disconnected",
      reconnectAttempts: 3,
    },
  },
});

Disconnected.test("turns actions off", async ({ canvas }) => {
  await expect(canvas.getByText(/^Showing data from/u)).toBeVisible();
  await expect(
    canvas.getByRole("button", { name: "Resume queue" }),
  ).toBeDisabled();
});

export const Mobile = meta.story({
  parameters: { viewport: { options: INITIAL_VIEWPORTS } },
  globals: { viewport: { value: "mobile1", isRotated: false } },
});
