import type { JobState } from "../../_utilities/job-states.ts";

export const emptyStateCopy: Readonly<
  Record<JobState, { message: string; description: string }>
> = {
  waiting: {
    message: "No jobs are waiting",
    description: "New jobs wait here until a worker picks them up.",
  },
  prioritized: {
    message: "No prioritised jobs",
    description: "Jobs added with a priority wait here, ahead of the rest.",
  },
  "waiting-children": {
    message: "No jobs are awaiting children",
    description:
      "A job waits here while the child jobs it started are still running.",
  },
  active: {
    message: "No jobs are running",
    description: "Jobs show here while a worker processes them.",
  },
  delayed: {
    message: "No scheduled jobs",
    description:
      "Jobs wait here until their retry backoff or scheduled time passes.",
  },
  failed: {
    message: "No failed jobs",
    description: "Jobs land here once they've used up their retries.",
  },
  completed: {
    message: "No completed jobs",
    description: "Finished jobs show here until they're cleaned.",
  },
  paused: {
    message: "No paused jobs",
    description: "Jobs wait here while the queue is paused.",
  },
};
