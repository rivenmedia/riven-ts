export const JOB_STATES = [
  "waiting",
  "prioritized",
  "waiting-children",
  "active",
  "delayed",
  "failed",
  "completed",
  "paused",
] as const;

export type JobState = (typeof JOB_STATES)[number];

export const jobStateLabels: Readonly<Record<JobState, string>> = {
  waiting: "Waiting",
  prioritized: "Prioritised",
  "waiting-children": "Awaiting children",
  active: "Active",
  delayed: "Scheduled",
  failed: "Failed",
  completed: "Completed",
  paused: "Paused",
};

export const jobStateColourClasses: Readonly<Record<JobState, string>> = {
  waiting: "bg-slate-600",
  prioritized: "bg-violet-700",
  "waiting-children": "bg-teal-700",
  active: "bg-sky-700",
  delayed: "bg-amber-700",
  failed: "bg-red-700",
  completed: "bg-emerald-700",
  paused: "bg-zinc-700",
};

const isJobState = (value: string): value is JobState =>
  (JOB_STATES as readonly string[]).includes(value);

/** Parses a `state` search param, falling back to `waiting`. */
export function parseJobStateParam(
  value: string | string[] | undefined,
): JobState {
  return typeof value === "string" && isJobState(value) ? value : "waiting";
}
