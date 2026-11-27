"use client";

import { GitBranch } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { JobStateBadge } from "../../../_components/job-state-badge/job-state-badge.tsx";
import { LiveControls } from "../../../_components/live-controls/live-controls.tsx";
import {
  LiveDataRegion,
  isLive,
} from "../../../_components/live-data-region/live-data-region.tsx";
import { getQueueDisplayName } from "../../../_utilities/queue-display-name.ts";
import { jobHref, queueHref } from "../../../_utilities/queue-routes.ts";
import { isTopLevelJob } from "../../_utilities/job-columns.ts";
import { FlowTree } from "./_components/flow-tree/flow-tree.tsx";
import { JobDataTabs } from "./_components/job-data-tabs/job-data-tabs.tsx";
import { JobFailure } from "./_components/job-failure/job-failure.tsx";
import { JobHeaderActions } from "./_components/job-header-actions/job-header-actions.tsx";
import { JobLogs } from "./_components/job-logs/job-logs.tsx";
import { JobSummary } from "./_components/job-summary/job-summary.tsx";
import { MediaItemCard } from "./_components/media-item-card/media-item-card.tsx";

import type {
  JobDetail,
  LiveStatus,
  QueueSummary,
} from "../../../_types/job-queue.ts";

export interface JobPageProps {
  job: JobDetail;
  queue: QueueSummary;
  liveStatus: LiveStatus;
  /** ISO 8601. Running durations are measured from this. */
  now: string;
  locale: string;
}

const handleRetry = () => {
  toast.success("Retried 1 job", { description: "They're back in Waiting." });
};

const copyLink = async () => {
  try {
    await navigator.clipboard.writeText(globalThis.location.href);
    toast.success("Link copied");
  } catch {
    toast.error("Couldn't copy the link");
  }
};

/** One job: its failure, logs, data, summary and flow. */
export function JobPage({ job, queue, liveStatus, now, locale }: JobPageProps) {
  const router = useRouter();
  const [isUpdatesPaused, setIsUpdatesPaused] = useState(false);
  const displayName = getQueueDisplayName(queue.name);
  const isActionable = isLive(liveStatus);
  const isTopLevel = isTopLevelJob(job);

  const handleRemove = () => {
    toast.success("Removed 1 job");
    router.push(queueHref(queue.name));
  };
  return (
    <div className="flex flex-col gap-6 p-4 md:p-8">
      <header className="flex flex-col gap-3">
        <nav aria-label="Breadcrumb" className="text-muted-foreground text-sm">
          <ol className="flex flex-wrap items-center gap-2">
            <li>
              <Link href="/queues" className="hover:underline">
                Queues
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link href={queueHref(queue.name)} className="hover:underline">
                {displayName}
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="text-foreground">
              Job #{job.id}
            </li>
          </ol>
        </nav>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex min-w-0 flex-col gap-1.5">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-semibold tracking-tight">
                Job <span className="font-mono">#{job.id}</span>
              </h1>
              <JobStateBadge state={job.state} />
            </div>
            <p className="text-sm">
              {job.name} <span className="text-muted-foreground">in</span>{" "}
              <span className="font-mono text-xs">{queue.name}</span>
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <LiveControls
              status={liveStatus}
              isUpdatesPaused={isUpdatesPaused}
              onUpdatesPausedChange={setIsUpdatesPaused}
            />
            <JobHeaderActions
              jobId={job.id}
              queueLabel={displayName}
              canRetry={isTopLevel && job.state === "failed"}
              canRemove={isTopLevel && job.state !== "active"}
              disabled={!isActionable}
              onRetry={handleRetry}
              onRemove={handleRemove}
              onCopyLink={() => {
                void copyLink();
              }}
            />
          </div>
        </div>
      </header>
      {job.parent ? (
        <div
          role="note"
          className="bg-card flex flex-wrap items-center gap-3 rounded-lg border px-4 py-3"
        >
          <GitBranch
            aria-hidden="true"
            className="text-muted-foreground size-4.5"
          />
          <p className="min-w-60 flex-1 text-sm">
            Part of a flow. Act on its top-level job instead.
          </p>
          <Link
            href={jobHref(job.flow.queueName, job.flow.id)}
            className="font-mono text-xs hover:underline"
          >
            {job.flow.queueName} #{job.flow.id}
          </Link>
        </div>
      ) : null}
      <LiveDataRegion status={liveStatus} locale={locale}>
        <div className="flex flex-wrap items-start gap-5">
          <div className="flex min-w-0 flex-[2_1_520px] flex-col gap-5">
            {job.state === "failed" ? (
              <JobFailure
                reason={job.failedReason}
                stacktrace={job.stacktrace}
              />
            ) : null}
            <JobLogs lines={job.logs} />
            <section
              aria-label="Job data"
              className="bg-card min-w-0 rounded-xl border p-5"
            >
              <JobDataTabs
                data={job.data}
                returnValue={job.returnValue}
                state={job.state}
              />
            </section>
          </div>
          <div className="flex min-w-0 flex-[1_1_300px] flex-col gap-5">
            <JobSummary job={job} now={now} locale={locale} />
            {job.mediaItem ? <MediaItemCard mediaItem={job.mediaItem} /> : null}
            <section
              aria-labelledby="job-flow-heading"
              className="bg-card flex min-w-0 flex-col gap-3 rounded-xl border p-5"
            >
              <h2 id="job-flow-heading" className="text-base font-semibold">
                Flow
              </h2>
              <FlowTree root={job.flow} currentJobId={job.id} />
            </section>
          </div>
        </div>
      </LiveDataRegion>
    </div>
  );
}
