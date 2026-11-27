import { expect, it } from "vitest";

import {
  JOB_STATES,
  jobStateLabels,
  parseJobStateParam,
} from "./job-states.ts";

it.for([
  ["delayed", "delayed"],
  ["failed", "failed"],
  [undefined, "waiting"],
  ["", "waiting"],
  ["bogus", "waiting"],
  ["Delayed", "waiting"],
  [["failed", "active"], "waiting"],
] as const)("parses %j as the %s state", ([value, expected]) => {
  expect(parseJobStateParam(value as string | string[] | undefined)).toBe(
    expected,
  );
});

it("labels the delayed state as Scheduled", () => {
  expect(jobStateLabels.delayed).toBe("Scheduled");
});

it("never labels a state as Delayed", () => {
  expect.hasAssertions();

  for (const state of JOB_STATES) {
    expect(jobStateLabels[state]).not.toMatch(/delayed/iu);
  }
});
