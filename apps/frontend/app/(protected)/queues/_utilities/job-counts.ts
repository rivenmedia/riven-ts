import { JOB_STATES } from "./job-states.ts";

import type { JobCounts } from "../_types/job-queue.ts";

export function emptyJobCounts(): JobCounts {
  return {
    waiting: 0,
    prioritized: 0,
    "waiting-children": 0,
    active: 0,
    delayed: 0,
    failed: 0,
    completed: 0,
    paused: 0,
  };
}

export function sumJobCounts(counts: readonly JobCounts[]): JobCounts {
  const total = { ...emptyJobCounts() };

  for (const count of counts) {
    for (const state of JOB_STATES) {
      total[state] += count[state];
    }
  }

  return total;
}
