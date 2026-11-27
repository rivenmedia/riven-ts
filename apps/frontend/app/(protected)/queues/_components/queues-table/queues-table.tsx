"use client";

import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "#components/_ui/table.tsx";
import { EmptyState } from "#components/empty-state/empty-state.tsx";

import { groupQueues } from "../../_utilities/group-queues.ts";
import { PluginGroupRows } from "./plugin-group-rows.tsx";
import { COUNT_COLUMNS, QueueRow, STICKY_CELL_CLASSES } from "./queue-row.tsx";

import type { QueueSummary } from "../../_types/job-queue.ts";

export interface QueuesTableProps {
  queues: readonly QueueSummary[];
  locale: string;
}

const pluralise = (count: number, noun: string) =>
  `${count.toString()} ${noun}${count === 1 ? "" : "s"}`;

function SectionHeading({ children }: { children: string }) {
  return (
    <TableRow className="bg-muted/30 hover:bg-muted/30">
      <TableHead
        scope="colgroup"
        colSpan={COUNT_COLUMNS.length + 1}
        className="text-muted-foreground text-xs font-medium tracking-wide uppercase"
      >
        <span className="sticky left-2">{children}</span>
      </TableHead>
    </TableRow>
  );
}

/** Every queue, in flows, sandboxed jobs and collapsible plugin groups. */
export function QueuesTable({ queues, locale }: QueuesTableProps) {
  if (queues.length === 0) {
    return <EmptyState message="No queues yet" />;
  }

  const { flows, sandboxed, plugins } = groupQueues(queues);
  const pluginQueueCount = plugins.reduce(
    (total, group) => total + group.queues.length,
    0,
  );

  return (
    <section aria-labelledby="all-queues-heading">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2 id="all-queues-heading" className="text-base font-medium">
          All queues
        </h2>
        <span className="text-muted-foreground text-sm">
          {pluralise(queues.length, "queue")}
        </span>
      </div>
      <div className="rounded-lg border">
        <Table className="min-w-[56rem]">
          <TableHeader>
            <TableRow>
              <TableHead className={STICKY_CELL_CLASSES}>Queue</TableHead>
              {COUNT_COLUMNS.map(({ state, label }) => (
                <TableHead key={state} className="text-right">
                  {label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {flows.length > 0 ? (
              <>
                <SectionHeading>
                  {`Flows · ${pluralise(flows.length, "queue")}`}
                </SectionHeading>
                {flows.map((queue) => (
                  <QueueRow key={queue.name} queue={queue} locale={locale} />
                ))}
              </>
            ) : null}
            {sandboxed.length > 0 ? (
              <>
                <SectionHeading>
                  {`Sandboxed jobs · ${pluralise(sandboxed.length, "queue")}`}
                </SectionHeading>
                {sandboxed.map((queue) => (
                  <QueueRow key={queue.name} queue={queue} locale={locale} />
                ))}
              </>
            ) : null}
            {plugins.length > 0 ? (
              <>
                <SectionHeading>
                  {`Plugins · ${pluralise(plugins.length, "plugin")}, ${pluralise(pluginQueueCount, "queue")}`}
                </SectionHeading>
                {plugins.map((group) => (
                  <PluginGroupRows
                    key={group.plugin.id}
                    group={group}
                    locale={locale}
                  />
                ))}
              </>
            ) : null}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}
