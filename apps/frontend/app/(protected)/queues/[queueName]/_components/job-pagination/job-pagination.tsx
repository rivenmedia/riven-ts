import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import Link from "next/link";

import { Button } from "#components/_ui/button.tsx";

import { formatCount } from "../../../_utilities/format.ts";
import { queueHref } from "../../../_utilities/queue-routes.ts";

import type { JobPage } from "../../../_types/job-queue.ts";
import type { JobState } from "../../../_utilities/job-states.ts";

export interface JobPaginationProps {
  queueName: string;
  state: JobState;
  jobPage: JobPage;
  locale: string;
}

/** The footer: which jobs are on show, and Previous and Next. */
export function JobPagination({
  queueName,
  state,
  jobPage,
  locale,
}: JobPaginationProps) {
  const { page, pageCount, pageSize, total } = jobPage;
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  const range =
    total === 0
      ? "0"
      : `${formatCount(from, locale)}–${formatCount(to, locale)}`;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-muted-foreground text-sm">
        {`Showing ${range} of ${formatCount(total, locale)}`}
      </p>
      <div className="flex gap-2">
        {page > 1 ? (
          <Button variant="outline" size="sm" asChild>
            <Link href={queueHref(queueName, { state, page: page - 1 })}>
              <ChevronLeftIcon data-icon="inline-start" />
              Previous
            </Link>
          </Button>
        ) : (
          <Button variant="outline" size="sm" disabled>
            <ChevronLeftIcon data-icon="inline-start" />
            Previous
          </Button>
        )}
        {page < pageCount ? (
          <Button variant="outline" size="sm" asChild>
            <Link href={queueHref(queueName, { state, page: page + 1 })}>
              Next
              <ChevronRightIcon data-icon="inline-end" />
            </Link>
          </Button>
        ) : (
          <Button variant="outline" size="sm" disabled>
            Next
            <ChevronRightIcon data-icon="inline-end" />
          </Button>
        )}
      </div>
    </div>
  );
}
