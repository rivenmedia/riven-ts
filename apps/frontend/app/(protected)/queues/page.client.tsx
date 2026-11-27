"use client";

import { useState } from "react";

import { LiveControls } from "./_components/live-controls/live-controls.tsx";
import { LiveDataRegion } from "./_components/live-data-region/live-data-region.tsx";
import { QueueTotals } from "./_components/queue-totals/queue-totals.tsx";
import { QueuesTable } from "./_components/queues-table/queues-table.tsx";
import { ThroughputPlaceholder } from "./_components/throughput-placeholder/throughput-placeholder.tsx";

import type { LiveStatus, QueueSummary } from "./_types/job-queue.ts";

export interface QueuesOverviewPageProps {
  queues: readonly QueueSummary[];
  liveStatus: LiveStatus;
  locale: string;
}

export function QueuesOverviewPage({
  queues,
  liveStatus,
  locale,
}: QueuesOverviewPageProps) {
  const [isUpdatesPaused, setIsUpdatesPaused] = useState(false);

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Queues</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Background jobs that request, scrape, download and post-process your
            media.
          </p>
        </div>
        <LiveControls
          status={liveStatus}
          isUpdatesPaused={isUpdatesPaused}
          onUpdatesPausedChange={setIsUpdatesPaused}
        />
      </header>
      <LiveDataRegion status={liveStatus} locale={locale}>
        <div className="flex flex-col gap-6">
          <QueueTotals queues={queues} locale={locale} />
          <ThroughputPlaceholder variant="overview" />
          <QueuesTable queues={queues} locale={locale} />
        </div>
      </LiveDataRegion>
    </div>
  );
}
