import { sumJobCounts } from "./job-counts.ts";

import type {
  FlowQueueSummary,
  JobCounts,
  PluginQueueSummary,
  QueueSummary,
  SandboxedQueueSummary,
} from "../_types/job-queue.ts";

export interface PluginQueueGroup {
  plugin: { id: string; displayName: string };
  queues: readonly PluginQueueSummary[];
  counts: JobCounts;
}

export interface QueueSections {
  flows: readonly FlowQueueSummary[];
  sandboxed: readonly SandboxedQueueSummary[];
  plugins: readonly PluginQueueGroup[];
}

/**
 * Splits queues into the overview's three sections. Flows and sandboxed queues
 * keep their input order; plugin queues are grouped per plugin, with groups
 * sorted by display name and queues sorted by name.
 */
export function groupQueues(queues: readonly QueueSummary[]): QueueSections {
  const flows: FlowQueueSummary[] = [];
  const sandboxed: SandboxedQueueSummary[] = [];
  const byPlugin = new Map<string, PluginQueueSummary[]>();

  for (const queue of queues) {
    if (queue.kind === "flow") {
      flows.push(queue);
    } else if (queue.kind === "sandboxed") {
      sandboxed.push(queue);
    } else {
      const group = byPlugin.get(queue.plugin.id) ?? [];

      group.push(queue);
      byPlugin.set(queue.plugin.id, group);
    }
  }

  const plugins = [...byPlugin.values()]
    .map((group) => {
      const sorted = group.toSorted((left, right) =>
        left.name.localeCompare(right.name),
      );

      return {
        plugin: sorted[0]?.plugin ?? { id: "", displayName: "" },
        queues: sorted,
        counts: sumJobCounts(sorted.map((queue) => queue.counts)),
      };
    })
    .toSorted((left, right) =>
      left.plugin.displayName.localeCompare(right.plugin.displayName),
    );

  return { flows, sandboxed, plugins };
}
