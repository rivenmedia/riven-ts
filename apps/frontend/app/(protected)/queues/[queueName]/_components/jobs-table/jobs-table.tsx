"use client";

import { ExternalLinkIcon } from "lucide-react";
import Link from "next/link";

import { Checkbox } from "#components/_ui/checkbox.tsx";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "#components/_ui/table.tsx";
import { EmptyState } from "#components/empty-state/empty-state.tsx";

import { formatRelativeTime, formatSpan } from "../../../_utilities/format.ts";
import { jobHref } from "../../../_utilities/queue-routes.ts";
import { emptyStateCopy } from "../../_utilities/empty-state-copy.ts";
import {
  columnsForState,
  isSelectableJob,
  isSelectableState,
  jobColumnHeaders,
} from "../../_utilities/job-columns.ts";

import type { JobSummary } from "../../../_types/job-queue.ts";
import type { JobState } from "../../../_utilities/job-states.ts";
import type { JobColumnId } from "../../_utilities/job-columns.ts";

export interface JobsTableProps {
  jobs: readonly JobSummary[];
  state: JobState;
  /** ISO 8601. Relative times and durations are measured from this. */
  now: string;
  locale: string;
  selectedIds: ReadonlySet<string>;
  onSelectedIdsChange: (next: ReadonlySet<string>) => void;
}

const delayReasonLabels = {
  "retry-backoff": "Retry backoff",
  scheduled: "Scheduled",
} as const;

const NO_VALUE = "—";

/** The formatted time from one ISO time to another, if both are known. */
const span = (from: string | undefined, to: string | undefined) =>
  from && to ? formatSpan(from, to) : NO_VALUE;

function RelativeTime({
  iso,
  now,
  locale,
}: {
  iso: string | undefined;
  now: string;
  locale: string;
}) {
  if (!iso) {
    return NO_VALUE;
  }

  return (
    <time dateTime={iso} suppressHydrationWarning>
      {formatRelativeTime(iso, now, locale)}
    </time>
  );
}

function renderCell(
  column: JobColumnId,
  job: JobSummary,
  now: string,
  locale: string,
) {
  switch (column) {
    case "created": {
      return <RelativeTime iso={job.createdAt} now={now} locale={locale} />;
    }
    case "waitingFor": {
      return span(job.createdAt, now);
    }
    case "children": {
      return job.children
        ? `${job.children.completed.toString()} of ${job.children.total.toString()} done`
        : NO_VALUE;
    }
    case "started": {
      return <RelativeTime iso={job.processedAt} now={now} locale={locale} />;
    }
    case "runningFor": {
      return span(job.processedAt, now);
    }
    case "progress": {
      return job.progress === undefined
        ? NO_VALUE
        : `${job.progress.toString()}%`;
    }
    case "runsIn": {
      return span(now, job.runAt);
    }
    case "delayReason": {
      return job.delayReason ? delayReasonLabels[job.delayReason] : NO_VALUE;
    }
    case "failureReason": {
      return (
        <span className="line-clamp-2 max-w-xs whitespace-normal">
          {job.failedReason ?? NO_VALUE}
        </span>
      );
    }
    case "failed":
    case "finished": {
      return <RelativeTime iso={job.finishedAt} now={now} locale={locale} />;
    }
    case "duration": {
      return span(job.processedAt, job.finishedAt);
    }
  }
}

/** Jobs of one state, with that state's columns and row selection. */
export function JobsTable({
  jobs,
  state,
  now,
  locale,
  selectedIds,
  onSelectedIdsChange,
}: JobsTableProps) {
  if (jobs.length === 0) {
    return <EmptyState {...emptyStateCopy[state]} />;
  }

  const columns = columnsForState(state);
  const selectableIds = jobs.filter(isSelectableJob).map((job) => job.id);
  const hasSelectColumn = isSelectableState(state) && selectableIds.length > 0;
  const selectedCount = selectableIds.filter((id) =>
    selectedIds.has(id),
  ).length;

  const toggleAll = (checked: boolean) => {
    const next = new Set(selectedIds);

    for (const id of selectableIds) {
      if (checked) {
        next.add(id);
      } else {
        next.delete(id);
      }
    }

    onSelectedIdsChange(next);
  };

  const toggleOne = (id: string, checked: boolean) => {
    const next = new Set(selectedIds);

    if (checked) {
      next.add(id);
    } else {
      next.delete(id);
    }

    onSelectedIdsChange(next);
  };

  return (
    <div className="rounded-lg border">
      <Table className="min-w-[48rem]">
        <TableHeader>
          <TableRow>
            {hasSelectColumn ? (
              <TableHead className="w-10">
                <Checkbox
                  aria-label={`Select all ${selectableIds.length.toString()} top-level ${selectableIds.length === 1 ? "job" : "jobs"} on this page`}
                  checked={
                    selectedCount === 0
                      ? false
                      : selectedCount === selectableIds.length ||
                        "indeterminate"
                  }
                  onCheckedChange={(checked) => {
                    toggleAll(checked === true);
                  }}
                />
              </TableHead>
            ) : null}
            <TableHead>Job</TableHead>
            <TableHead>Media item</TableHead>
            <TableHead>Attempts</TableHead>
            {columns.map((column) => (
              <TableHead key={column}>{jobColumnHeaders[column]}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {jobs.map((job) => (
            <TableRow
              className="group"
              key={job.id}
              data-state={selectedIds.has(job.id) ? "selected" : undefined}
            >
              {hasSelectColumn ? (
                <TableCell>
                  {isSelectableJob(job) ? (
                    <Checkbox
                      aria-label={`Select job ${job.id}`}
                      checked={selectedIds.has(job.id)}
                      onCheckedChange={(checked) => {
                        toggleOne(job.id, checked === true);
                      }}
                    />
                  ) : null}
                </TableCell>
              ) : null}
              <TableCell>
                <Link
                  href={jobHref(job.queueName, job.id)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-mono hover:underline"
                >
                  <span aria-hidden="true">#</span>
                  <span className="sr-only">Job </span>
                  {job.id}
                  <span className="sr-only"> (opens in a new tab)</span>
                  <ExternalLinkIcon className="size-3" aria-hidden="true" />
                </Link>
                {job.parent ? (
                  <div className="text-muted-foreground group-data-[state=selected]:text-foreground/80 text-xs">
                    In flow under{" "}
                    <Link
                      href={jobHref(job.parent.queueName, job.parent.id)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline"
                    >
                      {`${job.parent.queueName} #${job.parent.id}`}
                      <span className="sr-only"> (opens in a new tab)</span>
                    </Link>
                  </div>
                ) : null}
              </TableCell>
              <TableCell>
                {job.mediaItem ? (
                  <>
                    <Link
                      href={job.mediaItem.detailsPath}
                      className="hover:underline"
                    >
                      {job.mediaItem.title}
                    </Link>
                    {job.mediaItem.subtitle ? (
                      <div className="text-muted-foreground group-data-[state=selected]:text-foreground/80 text-xs">
                        {job.mediaItem.subtitle}
                      </div>
                    ) : null}
                  </>
                ) : (
                  NO_VALUE
                )}
              </TableCell>
              <TableCell className="tabular-nums">
                {`${job.attemptsMade.toString()} / ${job.maxAttempts.toString()}`}
              </TableCell>
              {columns.map((column) => (
                <TableCell key={column} className="tabular-nums">
                  {renderCell(column, job, now, locale)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
