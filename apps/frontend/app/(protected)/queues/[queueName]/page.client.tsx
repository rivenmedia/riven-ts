"use client";

import Link from "next/link";
import { useState } from "react";

import { LiveControls } from "../_components/live-controls/live-controls.tsx";
import {
  LiveDataRegion,
  isLive,
} from "../_components/live-data-region/live-data-region.tsx";
import { ThroughputPlaceholder } from "../_components/throughput-placeholder/throughput-placeholder.tsx";
import { getQueueDisplayName } from "../_utilities/queue-display-name.ts";
import { GoToJobForm } from "./_components/go-to-job-form/go-to-job-form.tsx";
import { JobPagination } from "./_components/job-pagination/job-pagination.tsx";
import { JobStateTabs } from "./_components/job-state-tabs/job-state-tabs.tsx";
import { JobsTable } from "./_components/jobs-table/jobs-table.tsx";
import { PausedQueueBanner } from "./_components/paused-queue-banner/paused-queue-banner.tsx";

import type { JobPage, LiveStatus, QueueSummary } from "../_types/job-queue.ts";
import type { JobState } from "../_utilities/job-states.ts";

export interface QueuePageProps {
  queue: QueueSummary;
  state: JobState;
  jobPage: JobPage;
  liveStatus: LiveStatus;
  /** ISO 8601. Relative times and durations are measured from this. */
  now: string;
  locale: string;
}

const NO_SELECTION: ReadonlySet<string> = new Set();

/** One queue: its state tabs, jobs and pagination. */
export function QueuePage({
  queue,
  state,
  jobPage,
  liveStatus,
  now,
  locale,
}: QueuePageProps) {
  const [isUpdatesPaused, setIsUpdatesPaused] = useState(false);
  // The selection belongs to one page of one state, so it resets on navigation.
  const scope = `${queue.name}|${state}|${jobPage.page.toString()}`;
  const [selection, setSelection] = useState({
    scope,
    ids: NO_SELECTION,
  });
  const selectedIds = selection.scope === scope ? selection.ids : NO_SELECTION;
  const displayName = getQueueDisplayName(queue.name);

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8">
      <header className="flex flex-col gap-3">
        <nav aria-label="Breadcrumb" className="text-muted-foreground text-sm">
          <ol className="flex items-center gap-2">
            <li>
              <Link href="/queues" className="hover:underline">
                Queues
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li aria-current="page">{displayName}</li>
          </ol>
        </nav>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {displayName}
            </h1>
            <p className="text-muted-foreground mt-1 font-mono text-xs">
              {`${queue.name} · ${queue.kind}`}
            </p>
          </div>
          <LiveControls
            status={liveStatus}
            isUpdatesPaused={isUpdatesPaused}
            onUpdatesPausedChange={setIsUpdatesPaused}
          />
        </div>
      </header>
      {queue.isPaused ? (
        <PausedQueueBanner
          queueLabel={displayName}
          disabled={!isLive(liveStatus)}
          // TODO(task 7): wire onResume
          onResume={() => undefined}
        />
      ) : null}
      <ThroughputPlaceholder variant="queue" />
      <LiveDataRegion status={liveStatus} locale={locale}>
        <div className="flex flex-col gap-4">
          <JobStateTabs
            queueName={queue.name}
            counts={queue.counts}
            currentState={state}
            locale={locale}
          />
          <GoToJobForm queueName={queue.name} />
          <JobsTable
            jobs={jobPage.jobs}
            state={state}
            now={now}
            locale={locale}
            selectedIds={selectedIds}
            onSelectedIdsChange={(ids) => {
              setSelection({ scope, ids });
            }}
          />
          <JobPagination
            queueName={queue.name}
            state={state}
            jobPage={jobPage}
            locale={locale}
          />
        </div>
      </LiveDataRegion>
    </div>
  );
}
