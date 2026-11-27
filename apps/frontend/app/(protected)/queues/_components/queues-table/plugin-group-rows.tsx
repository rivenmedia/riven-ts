import { cn } from "cn";
import { ChevronRight } from "lucide-react";
import { useState } from "react";

import { TableCell, TableRow } from "#components/_ui/table.tsx";

import { CountCells, QueueRow, STICKY_CELL_CLASSES } from "./queue-row.tsx";

import type { PluginQueueGroup } from "../../_utilities/group-queues.ts";

export interface PluginGroupRowsProps {
  group: PluginQueueGroup;
  locale: string;
}

/** A plugin's totals row, with its queues revealed beneath when expanded. */
export function PluginGroupRows({ group, locale }: PluginGroupRowsProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { displayName } = group.plugin;
  const queueCount = group.queues.length;

  return (
    <>
      <TableRow>
        <TableCell className={STICKY_CELL_CLASSES}>
          <button
            type="button"
            aria-expanded={isExpanded}
            className="hover:text-foreground flex items-center gap-2 font-medium"
            onClick={() => {
              setIsExpanded((current) => !current);
            }}
          >
            <ChevronRight
              aria-hidden="true"
              className={cn(
                "size-4 transition-transform",
                isExpanded && "rotate-90",
              )}
            />
            <span className="sr-only">
              {isExpanded ? "Collapse" : "Expand"}
            </span>
            <span>{displayName}</span>
            <span className="text-muted-foreground text-xs font-normal">
              {queueCount === 1 ? "1 queue" : `${queueCount.toString()} queues`}
            </span>
          </button>
        </TableCell>
        <CountCells counts={group.counts} locale={locale} />
      </TableRow>
      {isExpanded
        ? group.queues.map((queue) => (
            <QueueRow key={queue.name} queue={queue} locale={locale} indented />
          ))
        : null}
    </>
  );
}
