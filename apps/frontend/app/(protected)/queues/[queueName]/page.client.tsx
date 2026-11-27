"use client";

import { RotateCcw, Trash } from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { SelectionActionBar } from "#components/selection-action-bar/selection-action-bar.tsx";

import { LiveControls } from "../_components/live-controls/live-controls.tsx";
import {
  LiveDataRegion,
  isLive,
} from "../_components/live-data-region/live-data-region.tsx";
import { ThroughputPlaceholder } from "../_components/throughput-placeholder/throughput-placeholder.tsx";
import { getQueueDisplayName } from "../_utilities/queue-display-name.ts";
import { ConfirmActionDialog } from "./_components/confirm-action-dialog/confirm-action-dialog.tsx";
import { GoToJobForm } from "./_components/go-to-job-form/go-to-job-form.tsx";
import { JobPagination } from "./_components/job-pagination/job-pagination.tsx";
import { JobStateTabs } from "./_components/job-state-tabs/job-state-tabs.tsx";
import { JobsTable } from "./_components/jobs-table/jobs-table.tsx";
import { PausedQueueBanner } from "./_components/paused-queue-banner/paused-queue-banner.tsx";
import { QueueHeaderActions } from "./_components/queue-header-actions/queue-header-actions.tsx";
import { jobCountLabel, removeConfirmCopy } from "./_utilities/action-copy.ts";
import {
  isSelectableJob,
  isSelectableState,
} from "./_utilities/job-columns.ts";

import type { SelectionAction } from "#components/selection-action-bar/selection-action-bar.tsx";
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
  /** Pre-selects jobs. For stories only. */
  initialSelectedIds?: readonly string[];
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
  initialSelectedIds,
}: QueuePageProps) {
  const [isUpdatesPaused, setIsUpdatesPaused] = useState(false);
  // The selection belongs to one page of one state, so it resets on navigation.
  const scope = `${queue.name}|${state}|${jobPage.page.toString()}`;
  const [selection, setSelection] = useState<{
    scope: string;
    ids: ReadonlySet<string>;
  }>({
    scope,
    ids: initialSelectedIds ? new Set(initialSelectedIds) : NO_SELECTION,
  });
  const [isRemoveOpen, setIsRemoveOpen] = useState(false);
  const jobsRegionRef = useRef<HTMLElement>(null);
  const selectedIds = selection.scope === scope ? selection.ids : NO_SELECTION;
  const displayName = getQueueDisplayName(queue.name);
  const isActionable = isLive(liveStatus);
  // Only visible, top-level jobs can reach an action, never a stale ID.
  const actionableIds = jobPage.jobs
    .filter((job) => isSelectableJob(job) && selectedIds.has(job.id))
    .map((job) => job.id);

  const clearSelection = () => {
    setSelection({ scope, ids: NO_SELECTION });
  };
  // The action bar unmounts once the selection clears, so focus moves to the jobs.
  const clearSelectionAndRestoreFocus = () => {
    clearSelection();
    setIsRemoveOpen(false);
    // After the dialog's own focus restore, which would land on the removed button.
    requestAnimationFrame(() => {
      jobsRegionRef.current?.focus();
    });
  };
  const handleRetry = () => {
    toast.success(`Retried ${jobCountLabel(actionableIds.length)}`, {
      description: "They're back in Waiting.",
    });
    clearSelectionAndRestoreFocus();
  };
  const handleRemove = () => {
    toast.success(`Removed ${jobCountLabel(actionableIds.length)}`);
    clearSelectionAndRestoreFocus();
  };
  const handlePause = () => {
    toast.success(`Paused ${displayName}`);
  };
  const handleResume = () => {
    toast.success(`Resumed ${displayName}`);
  };
  const removeAction: SelectionAction = {
    label: "Remove",
    icon: Trash,
    variant: "destructive",
    handleClick: () => {
      setIsRemoveOpen(true);
    },
  };
  const retryAction: SelectionAction = {
    label: "Retry",
    icon: RotateCcw,
    handleClick: handleRetry,
  };
  const handleClean = (cleanState: "completed" | "failed") => {
    const count = queue.counts[cleanState];
    const noun = count === 1 ? "job" : "jobs";

    toast.success(`Cleaned ${count.toString()} ${cleanState} ${noun}`);
  };

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
          <div className="flex flex-wrap items-center gap-3">
            <LiveControls
              status={liveStatus}
              isUpdatesPaused={isUpdatesPaused}
              onUpdatesPausedChange={setIsUpdatesPaused}
            />
            <QueueHeaderActions
              queue={queue}
              disabled={!isActionable}
              onPause={handlePause}
              onResume={handleResume}
              onClean={handleClean}
            />
          </div>
        </div>
      </header>
      {queue.isPaused ? (
        <PausedQueueBanner
          queueLabel={displayName}
          disabled={!isActionable}
          onResume={handleResume}
        />
      ) : null}
      <ThroughputPlaceholder variant="queue" />
      <section
        ref={jobsRegionRef}
        aria-label="Jobs"
        tabIndex={-1}
        className="outline-none"
      >
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
      </section>
      {actionableIds.length > 0 && isSelectableState(state) ? (
        <>
          <SelectionActionBar
            count={actionableIds.length}
            disabled={!isActionable}
            onClear={clearSelection}
            actions={
              state === "failed" ? [retryAction, removeAction] : [removeAction]
            }
          />
          <ConfirmActionDialog
            open={isRemoveOpen}
            onOpenChange={setIsRemoveOpen}
            copy={removeConfirmCopy(actionableIds, displayName)}
            onConfirm={handleRemove}
          />
        </>
      ) : null}
    </div>
  );
}
