import { expect, it } from "vitest";

import { JOB_STATES } from "../../_utilities/job-states.ts";
import {
  columnsForState,
  isSelectableJob,
  isSelectableState,
  isTopLevelJob,
  jobColumnHeaders,
} from "./job-columns.ts";

const parent = { id: "1", queueName: "q" };

it.each([
  ["waiting", ["created", "waitingFor"]],
  ["prioritized", ["created", "waitingFor"]],
  ["paused", ["created", "waitingFor"]],
  ["waiting-children", ["created", "children"]],
  ["active", ["started", "runningFor", "progress"]],
  ["delayed", ["runsIn", "delayReason"]],
  ["failed", ["failureReason", "failed", "duration"]],
  ["completed", ["finished", "duration"]],
] as const)("lists the %s columns", (state, columns) => {
  expect(columnsForState(state)).toStrictEqual(columns);
});

it("covers every state", () => {
  expect.hasAssertions();

  for (const state of JOB_STATES) {
    expect(columnsForState(state).length).toBeGreaterThan(0);
  }
});

it("has a header for every column", () => {
  expect(jobColumnHeaders).toStrictEqual({
    created: "Created",
    waitingFor: "Waiting for",
    children: "Children",
    started: "Started",
    runningFor: "Running for",
    progress: "Progress",
    runsIn: "Runs in",
    delayReason: "Reason",
    failureReason: "Failure reason",
    failed: "Failed",
    duration: "Duration",
    finished: "Finished",
  });
});

it("makes every state but active selectable", () => {
  expect.hasAssertions();

  for (const state of JOB_STATES) {
    expect(isSelectableState(state)).toBe(state !== "active");
  }
});

it("treats a job without a parent as top level", () => {
  expect(isTopLevelJob({})).toBe(true);
  expect(isTopLevelJob({ parent })).toBe(false);
});

it("selects only top-level jobs in selectable states", () => {
  expect(isSelectableJob({ state: "failed" })).toBe(true);
  expect(isSelectableJob({ state: "failed", parent })).toBe(false);
  expect(isSelectableJob({ state: "active" })).toBe(false);
});
