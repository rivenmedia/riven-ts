import { expect, it } from "vitest";

import { FIXTURE_NOW } from "../_fixtures/jobs.fixture.ts";
import { JOB_STATES } from "../_utilities/job-states.ts";
import {
  JOB_PAGE_SIZE,
  getJob,
  getJobs,
  getLiveStatus,
  getQueue,
  getQueues,
} from "./queue-data.ts";

it("has 32 queues with unique names", () => {
  const names = getQueues().map((queue) => queue.name);

  expect(names).toHaveLength(32);
  expect(new Set(names).size).toBe(32);
});

it("has 19 plugin queues", () => {
  expect(getQueues().filter((queue) => queue.kind === "plugin")).toHaveLength(
    19,
  );
});

it("pauses request-subtitles", () => {
  expect(getQueue("request-subtitles")?.isPaused).toBe(true);
});

it("pins the scrape-item failed count", () => {
  expect(getQueue("scrape-item")?.counts.failed).toBe(9);
});

it("returns undefined for unknown queues and jobs", () => {
  expect(getQueue("nope")).toBeUndefined();
  expect(getJobs("nope", "waiting", 1).total).toBe(0);
  expect(getJob("scrape-item", "nope")).toBeUndefined();
  expect(getJob("nope", "48213")).toBeUndefined();
});

it("returns the pinned scrape-item failed jobs", () => {
  const result = getJobs("scrape-item", "failed", 1);

  expect(result.jobs.map((job) => job.id)).toStrictEqual([
    "48213",
    "48207",
    "48168",
    "48152",
    "48101",
    "47988",
    "47950",
    "47911",
    "47802",
  ]);
  expect(result).toMatchObject({ total: 9, pageCount: 1, pageSize: 25 });
  expect(JOB_PAGE_SIZE).toBe(25);
});

it("gives every scrape-item failed job a parent, name and failure", () => {
  expect.hasAssertions();

  for (const job of getJobs("scrape-item", "failed", 1).jobs) {
    expect(job.parent?.queueName).toBe("process-media-item");
    expect(job.name).not.toBe("");
    expect(job.failedReason).not.toBe("");
    expect(job.finishedAt).toBeDefined();
  }
});

it("clamps the page to the last page", () => {
  const result = getJobs("scrape-item", "completed", 999);

  expect(result.page).toBe(278);
  expect(result.jobs).toHaveLength(5);
});

it("clamps a page below 1 up to 1", () => {
  expect(getJobs("scrape-item", "completed", 0).page).toBe(1);
});

it("returns an empty page for a state with no jobs", () => {
  expect(getJobs("scrape-item", "waiting-children", 1)).toStrictEqual({
    jobs: [],
    page: 1,
    pageCount: 1,
    total: 0,
    pageSize: 25,
  });
});

it("returns the pinned process-media-item failed jobs", () => {
  const { jobs } = getJobs("process-media-item", "failed", 1);

  expect(jobs.map((job) => job.id)).toStrictEqual([
    "49012",
    "48998",
    "48871",
    "48702",
    "48655",
    "48511",
    "48302",
  ]);
  expect(jobs.filter((job) => !job.parent).map((job) => job.id)).toStrictEqual([
    "49012",
    "48702",
    "48655",
    "48302",
  ]);
  expect(jobs[1]?.parent).toStrictEqual({
    id: "48960",
    queueName: "process-item-request",
  });
});

it("returns job 48213 with its flow", () => {
  const job = getJob("scrape-item", "48213");

  expect(job?.flow.id).toBe("48177");
  expect(job?.parent).toStrictEqual({
    id: "48190",
    queueName: "process-media-item",
  });
  expect(job?.failedReason).toBe("No streams passed ranking (0 of 41)");
  expect(job?.mediaItem?.detailsPath).toMatch(/^\/details\/media\/show\//u);
});

it("builds a detail for every job getJobs returns", () => {
  expect.hasAssertions();

  const { jobs } = getJobs("process-media-item", "failed", 1);

  for (const summary of jobs) {
    const detail = getJob(summary.queueName, summary.id);

    expect(detail).toMatchObject({ id: summary.id, state: summary.state });
    expect(detail?.flow.id).toBe(summary.id);
  }
});

it.for([
  ["scrape-item", "waiting"],
  ["scrape-item", "completed"],
  ["process-media-item", "active"],
  ["riven.media-item.scrape.requested.plugin[torrentio]", "delayed"],
  ["map-items-to-files", "completed"],
] as const)("generates matching jobs for %s / %s", ([queueName, state]) => {
  expect.hasAssertions();

  const result = getJobs(queueName, state, 2);

  for (const job of result.jobs) {
    expect(job.state).toBe(state);
    expect(job.queueName).toBe(queueName);
    expect(getJob(queueName, job.id)?.id).toBe(job.id);
  }
});

it("gives every generated job in a child queue a parent", () => {
  expect.hasAssertions();

  for (const queue of getQueues()) {
    if (
      queue.name === "process-item-request" ||
      queue.name === "request-content-services"
    ) {
      continue;
    }

    for (const state of JOB_STATES) {
      for (const job of getJobs(queue.name, state, 1).jobs) {
        if (queue.name === "process-media-item" && state === "failed") {
          continue;
        }

        expect(job.parent, `${queue.name} ${job.id}`).toBeDefined();
      }
    }
  }
});

it("generates deterministically", () => {
  expect(getJobs("scrape-item", "completed", 3)).toStrictEqual(
    getJobs("scrape-item", "completed", 3),
  );
});

it("reports a connected live status", () => {
  expect(getLiveStatus()).toStrictEqual({
    connectionStatus: "connected",
    reconnectAttempts: 0,
    maxReconnectAttempts: 3,
    lastUpdatedAt: FIXTURE_NOW,
  });
});
