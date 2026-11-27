import { cn } from "cn";
import Link from "next/link";

import { Badge } from "#components/_ui/badge.tsx";
import { TableCell, TableRow } from "#components/_ui/table.tsx";

import { formatCount } from "../../_utilities/format.ts";
import { getQueueDisplayName } from "../../_utilities/queue-display-name.ts";
import { queueHref } from "../../_utilities/queue-routes.ts";

import type { JobCounts, QueueSummary } from "../../_types/job-queue.ts";
import type { JobState } from "../../_utilities/job-states.ts";

/** The count columns, in display order. */
export const COUNT_COLUMNS: readonly {
  state: JobState;
  label: string;
}[] = [
  { state: "active", label: "Active" },
  { state: "waiting", label: "Waiting" },
  { state: "prioritized", label: "Prioritised" },
  { state: "waiting-children", label: "Awaiting children" },
  { state: "delayed", label: "Scheduled" },
  { state: "failed", label: "Failed" },
  { state: "completed", label: "Completed" },
];

/** The cells for every count column. Zeros are muted; failures are red. */
export function CountCells({
  counts,
  locale,
}: {
  counts: JobCounts;
  locale: string;
}) {
  return COUNT_COLUMNS.map(({ state }) => {
    const value = counts[state];

    return (
      <TableCell
        key={state}
        className={cn(
          "text-right tabular-nums",
          value === 0 && "text-muted-foreground",
          state === "failed" && value > 0 && "font-medium text-red-400",
        )}
      >
        {formatCount(value, locale)}
      </TableCell>
    );
  });
}

export const STICKY_CELL_CLASSES = "bg-background sticky left-0 z-10";

export interface QueueRowProps {
  queue: QueueSummary;
  locale: string;
  indented?: boolean;
}

/** One queue: its name linked to the queue page, then its counts. */
export function QueueRow({ queue, locale, indented = false }: QueueRowProps) {
  return (
    <TableRow>
      <TableCell className={cn(STICKY_CELL_CLASSES, indented && "pl-9")}>
        <div className="flex items-center gap-2">
          <Link
            href={queueHref(queue.name)}
            className="font-medium hover:underline"
          >
            {getQueueDisplayName(queue.name)}
          </Link>
          {queue.isPaused ? <Badge variant="outline">Paused</Badge> : null}
        </div>
        <div className="text-muted-foreground font-mono text-xs">
          {queue.name}
        </div>
      </TableCell>
      <CountCells counts={queue.counts} locale={locale} />
    </TableRow>
  );
}
