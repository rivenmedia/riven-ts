import type { JobSummary } from "../../_types/job-queue.ts";
import type { JobState } from "../../_utilities/job-states.ts";

export type JobColumnId =
  | "created"
  | "waitingFor"
  | "children"
  | "started"
  | "runningFor"
  | "progress"
  | "runsIn"
  | "delayReason"
  | "failureReason"
  | "failed"
  | "duration"
  | "finished";

export const jobColumnHeaders: Readonly<Record<JobColumnId, string>> = {
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
};

const waitingColumns = ["created", "waitingFor"] as const;

const columnsByState: Readonly<Record<JobState, readonly JobColumnId[]>> = {
  waiting: waitingColumns,
  prioritized: waitingColumns,
  paused: waitingColumns,
  "waiting-children": ["created", "children"],
  active: ["started", "runningFor", "progress"],
  delayed: ["runsIn", "delayReason"],
  failed: ["failureReason", "failed", "duration"],
  completed: ["finished", "duration"],
};

/** The columns a state's tab adds after Job, Media item and Attempts. */
export function columnsForState(state: JobState): readonly JobColumnId[] {
  return columnsByState[state];
}

/** Active jobs can't be selected. */
export function isSelectableState(state: JobState) {
  return state !== "active";
}

/** A job outside any flow. */
export function isTopLevelJob(job: Pick<JobSummary, "parent">) {
  return !job.parent;
}

export function isSelectableJob(job: Pick<JobSummary, "parent" | "state">) {
  return isTopLevelJob(job) && isSelectableState(job.state);
}
