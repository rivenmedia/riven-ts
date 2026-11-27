import {
  FIXTURE_NOW,
  GENERATED_ID_STRIDE,
  buildJobDetail,
  generateJobSummary,
  getQueueIdSeed,
  handWrittenFailedJobs,
  handWrittenLinkedJobs,
} from "../_fixtures/jobs.fixture.ts";
import { queueSummaries } from "../_fixtures/queues.fixture.ts";
import { JOB_STATES } from "../_utilities/job-states.ts";

import type {
  JobDetail,
  JobPage,
  JobSummary,
  LiveStatus,
  QueueSummary,
} from "../_types/job-queue.ts";
import type { JobState } from "../_utilities/job-states.ts";

/**
 * A stand-in for the future GraphQL adapter. The pages import only this
 * module, so swapping in the real queries doesn't touch them.
 */
export const JOB_PAGE_SIZE = 25;

export function getQueues(): readonly QueueSummary[] {
  return queueSummaries;
}

export function getQueue(queueName: string) {
  return queueSummaries.find((queue) => queue.name === queueName);
}

/** The jobs on one page of a queue's state, built on demand. */
function buildJobs(
  queue: QueueSummary,
  state: JobState,
  start: number,
  end: number,
): readonly JobSummary[] {
  const handWritten = state === "failed" && handWrittenFailedJobs[queue.name];

  if (handWritten) {
    return handWritten.slice(start, end);
  }

  return Array.from({ length: end - start }, (_, offset) =>
    generateJobSummary(queue, state, start + offset),
  );
}

export function getJobs(
  queueName: string,
  state: JobState,
  page: number,
): JobPage {
  const queue = getQueue(queueName);
  const total = queue?.counts[state] ?? 0;
  const pageCount = Math.max(Math.ceil(total / JOB_PAGE_SIZE), 1);
  const clamped = Math.min(Math.max(Math.trunc(page) || 1, 1), pageCount);
  const start = (clamped - 1) * JOB_PAGE_SIZE;
  const end = Math.min(start + JOB_PAGE_SIZE, total);

  return {
    jobs: queue ? buildJobs(queue, state, start, end) : [],
    page: clamped,
    pageCount,
    total,
    pageSize: JOB_PAGE_SIZE,
  };
}

/** Finds a summary by ID: the hand-written jobs first, then the generated ones. */
function findJobSummary(queue: QueueSummary, jobId: string) {
  const handWritten = handWrittenFailedJobs[queue.name]?.find(
    (job) => job.id === jobId,
  );

  if (handWritten) {
    return handWritten;
  }

  const linked = handWrittenLinkedJobs.find(
    (job) => job.queueName === queue.name && job.id === jobId,
  );

  if (linked) {
    return linked;
  }

  if (!/^\d+$/u.test(jobId)) {
    return undefined;
  }

  const offset = getQueueIdSeed(queue.name) - Number(jobId);

  if (offset < 0) {
    return undefined;
  }

  const state = JOB_STATES[offset % GENERATED_ID_STRIDE];
  const index = Math.floor(offset / GENERATED_ID_STRIDE);

  if (
    !state ||
    index >= queue.counts[state] ||
    (state === "failed" && handWrittenFailedJobs[queue.name])
  ) {
    return undefined;
  }

  return generateJobSummary(queue, state, index);
}

export function getJob(
  queueName: string,
  jobId: string,
): JobDetail | undefined {
  const queue = getQueue(queueName);
  const summary = queue && findJobSummary(queue, jobId);

  return summary ? buildJobDetail(summary) : undefined;
}

export function getLiveStatus(): LiveStatus {
  return {
    connectionStatus: "connected",
    reconnectAttempts: 0,
    maxReconnectAttempts: 3,
    lastUpdatedAt: FIXTURE_NOW,
  };
}
