import { DateTime } from "luxon";
import Link from "next/link";

import {
  formatDateTime,
  formatDuration,
} from "../../../../../_utilities/format.ts";
import { jobHref, queueHref } from "../../../../../_utilities/queue-routes.ts";

import type { JobDetail } from "../../../../../_types/job-queue.ts";
import type { ReactNode } from "react";

export interface JobSummaryProps {
  job: JobDetail;
  /** ISO 8601. Running durations are measured from this. */
  now: string;
  locale: string;
}

function Row({
  label,
  wide,
  children,
}: {
  label: string;
  wide?: boolean;
  children: ReactNode;
}) {
  return (
    <div className={wide ? "col-span-2" : undefined}>
      <dt className="text-muted-foreground text-xs">{label}</dt>
      <dd className="mt-0.5 text-sm">{children}</dd>
    </div>
  );
}

function Time({ iso, locale }: { iso: string | undefined; locale: string }) {
  return iso ? (
    <time dateTime={iso} suppressHydrationWarning className="font-mono">
      {formatDateTime(iso, locale)}
    </time>
  ) : (
    <span className="text-muted-foreground">Not yet</span>
  );
}

function getDuration(job: JobDetail, now: string) {
  if (!job.processedAt) {
    return undefined;
  }

  const end = job.finishedAt ?? now;

  return formatDuration(
    DateTime.fromISO(end).diff(DateTime.fromISO(job.processedAt)).toMillis(),
  );
}

/** A job's name, attempts, timings and links. */
export function JobSummary({ job, now, locale }: JobSummaryProps) {
  const duration = getDuration(job, now);

  return (
    <section
      aria-labelledby="job-summary-heading"
      className="bg-card flex min-w-0 flex-col gap-3 rounded-xl border p-5"
    >
      <h2 id="job-summary-heading" className="text-base font-semibold">
        Summary
      </h2>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
        <Row label="Name" wide>
          {job.name}
        </Row>
        <Row label="Attempts">
          <span className="font-mono">
            {job.attemptsMade} of {job.maxAttempts}
          </span>
        </Row>
        {job.state === "active" && job.progress !== undefined ? (
          <Row label="Progress">
            <span className="font-mono">{job.progress}%</span>
          </Row>
        ) : null}
        <Row label="Duration">
          {duration ? (
            <span className="font-mono">{duration}</span>
          ) : (
            <span className="text-muted-foreground">Not yet</span>
          )}
        </Row>
        <Row label="Created">
          <Time iso={job.createdAt} locale={locale} />
        </Row>
        <Row label="Started">
          <Time iso={job.processedAt} locale={locale} />
        </Row>
        <Row label="Finished">
          <Time iso={job.finishedAt} locale={locale} />
        </Row>
        <Row label="Queue">
          <Link
            href={queueHref(job.queueName)}
            className="font-mono text-xs break-words hover:underline"
          >
            {job.queueName}
          </Link>
        </Row>
        {job.parent ? (
          <Row label="Parent job" wide>
            <Link
              href={jobHref(job.parent.queueName, job.parent.id)}
              className="font-mono text-xs break-words hover:underline"
            >
              {job.parent.queueName} #{job.parent.id}
            </Link>
          </Row>
        ) : null}
      </dl>
    </section>
  );
}
