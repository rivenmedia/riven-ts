"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { JobStateDot } from "../../../../../_components/job-state-dot/job-state-dot.tsx";
import { jobStateLabels } from "../../../../../_utilities/job-states.ts";
import { jobHref } from "../../../../../_utilities/queue-routes.ts";

import type { FlowNode } from "../../../../../_types/job-queue.ts";

export interface FlowTreeProps {
  root: FlowNode;
  currentJobId: string;
}

interface FlowTreeNodeProps {
  node: FlowNode;
  currentJobId: string;
  collapsedIds: ReadonlySet<string>;
  onToggle: (id: string) => void;
}

function FlowTreeNode({
  node,
  currentJobId,
  collapsedIds,
  onToggle,
}: FlowTreeNodeProps) {
  const isCurrent = node.id === currentJobId;
  const isExpanded = !collapsedIds.has(node.id);
  const label = `${node.queueName} #${node.id}`;

  return (
    <li>
      <div
        className={
          isCurrent
            ? "bg-destructive/10 ring-destructive/35 flex items-start gap-2 rounded-lg px-2 py-1.5 ring-1"
            : "flex items-start gap-2 px-2 py-1.5"
        }
      >
        {node.children.length > 0 ? (
          <button
            type="button"
            aria-expanded={isExpanded}
            aria-label={`${isExpanded ? "Collapse" : "Expand"} ${label}`}
            className="text-muted-foreground hover:bg-muted hover:text-foreground inline-flex size-5.5 shrink-0 items-center justify-center rounded-md"
            onClick={() => {
              onToggle(node.id);
            }}
          >
            <ChevronRight
              aria-hidden="true"
              className={isExpanded ? "size-3.5 rotate-90" : "size-3.5"}
            />
          </button>
        ) : (
          <span aria-hidden="true" className="size-5.5 shrink-0" />
        )}
        <span className="mt-2 flex">
          <JobStateDot state={node.state} />
        </span>
        <div className="flex min-w-0 flex-col gap-0.5">
          <Link
            href={jobHref(node.queueName, node.id)}
            aria-current={isCurrent ? "page" : undefined}
            className="font-mono text-xs break-words hover:underline"
          >
            {node.queueName}{" "}
            <span className="text-muted-foreground">#{node.id}</span>
          </Link>
          <span className="text-muted-foreground text-xs">
            {jobStateLabels[node.state]}
            {isCurrent ? " · this job" : ""}
            {node.failureIgnoredByParent
              ? " · parent ignored this failure"
              : ""}
          </span>
        </div>
      </div>
      {node.children.length > 0 && isExpanded ? (
        <ul className="ml-4 flex flex-col gap-0.5">
          {node.children.map((child) => (
            <FlowTreeNode
              key={`${child.queueName}-${child.id}`}
              node={child}
              currentJobId={currentJobId}
              collapsedIds={collapsedIds}
              onToggle={onToggle}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

/** The job's whole flow as a nested list, from the root job. */
export function FlowTree({ root, currentJobId }: FlowTreeProps) {
  const [collapsedIds, setCollapsedIds] = useState<ReadonlySet<string>>(
    new Set(),
  );

  const handleToggle = (id: string) => {
    setCollapsedIds((previous) => {
      const next = new Set(previous);

      if (!next.delete(id)) {
        next.add(id);
      }

      return next;
    });
  };

  return (
    <ul className="flex flex-col gap-0.5">
      <FlowTreeNode
        node={root}
        currentJobId={currentJobId}
        collapsedIds={collapsedIds}
        onToggle={handleToggle}
      />
    </ul>
  );
}
