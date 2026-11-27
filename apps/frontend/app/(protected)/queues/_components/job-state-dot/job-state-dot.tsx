import { cn } from "cn";

import { jobStateColourClasses } from "../../_utilities/job-states.ts";

import type { JobState } from "../../_utilities/job-states.ts";

export interface JobStateDotProps {
  state: JobState;
}

/** Small coloured dot for a job state. Decorative: pair it with a label. */
export function JobStateDot({ state }: JobStateDotProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-block size-2 shrink-0 rounded-full",
        jobStateColourClasses[state],
      )}
    />
  );
}
