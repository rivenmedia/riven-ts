import { cn } from "cn";

import { Badge } from "#components/_ui/badge.tsx";

import {
  jobStateColourClasses,
  jobStateLabels,
} from "../../_utilities/job-states.ts";

import type { JobState } from "../../_utilities/job-states.ts";

export interface JobStateBadgeProps {
  state: JobState;
}

/** Badge showing a job state's label in its colour. */
export function JobStateBadge({ state }: JobStateBadgeProps) {
  return (
    <Badge className={cn("text-white", jobStateColourClasses[state])}>
      {jobStateLabels[state]}
    </Badge>
  );
}
