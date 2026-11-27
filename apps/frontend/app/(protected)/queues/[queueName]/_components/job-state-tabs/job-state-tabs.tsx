import { cn } from "cn";
import Link from "next/link";

import { JobStateDot } from "../../../_components/job-state-dot/job-state-dot.tsx";
import { formatCount } from "../../../_utilities/format.ts";
import { JOB_STATES, jobStateLabels } from "../../../_utilities/job-states.ts";
import { queueHref } from "../../../_utilities/queue-routes.ts";

import type { JobCounts } from "../../../_types/job-queue.ts";
import type { JobState } from "../../../_utilities/job-states.ts";

export interface JobStateTabsProps {
  queueName: string;
  counts: JobCounts;
  currentState: JobState;
  locale: string;
}

/** The job states as links, each with its dot, label and count. */
export function JobStateTabs({
  queueName,
  counts,
  currentState,
  locale,
}: JobStateTabsProps) {
  return (
    <nav aria-label="Job states" className="overflow-x-auto border-b">
      <ul className="flex min-w-max gap-1">
        {JOB_STATES.map((state) => {
          const isCurrent = state === currentState;

          return (
            <li key={state}>
              <Link
                href={queueHref(queueName, { state })}
                aria-current={isCurrent ? "page" : undefined}
                className={cn(
                  "-mb-px flex items-center gap-2 border-b-2 px-3 py-2 text-sm whitespace-nowrap",
                  isCurrent
                    ? "border-primary font-medium"
                    : "text-muted-foreground hover:text-foreground border-transparent",
                )}
              >
                <JobStateDot state={state} />
                {jobStateLabels[state]}
                <span className="text-muted-foreground tabular-nums">
                  {formatCount(counts[state], locale)}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
