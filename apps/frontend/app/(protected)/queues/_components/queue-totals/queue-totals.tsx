import { KpiStatTile } from "#components/kpi-stat-tile/kpi-stat-tile.tsx";

import { formatCount } from "../../_utilities/format.ts";
import { sumJobCounts } from "../../_utilities/job-counts.ts";

import type { QueueSummary } from "../../_types/job-queue.ts";

export interface QueueTotalsProps {
  queues: readonly QueueSummary[];
  locale: string;
}

/** Active, waiting, scheduled and failed jobs summed across every queue. */
export function QueueTotals({ queues, locale }: QueueTotalsProps) {
  const totals = sumJobCounts(queues.map((queue) => queue.counts));

  return (
    <div className="grid grid-cols-2 gap-x-6 sm:grid-cols-4">
      <KpiStatTile title="Active" value={formatCount(totals.active, locale)} />
      <KpiStatTile
        title="Waiting"
        value={formatCount(totals.waiting, locale)}
      />
      <KpiStatTile
        title="Scheduled"
        value={formatCount(totals.delayed, locale)}
      />
      <KpiStatTile
        title="Failed"
        value={formatCount(totals.failed, locale)}
        tone={totals.failed > 0 ? "warning" : "default"}
      />
    </div>
  );
}
