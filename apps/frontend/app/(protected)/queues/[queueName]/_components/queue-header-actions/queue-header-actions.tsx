import { ChevronDown, Pause, Play } from "lucide-react";
import { useState } from "react";

import { Button } from "#components/_ui/button.tsx";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "#components/_ui/dropdown-menu.tsx";

import { getQueueDisplayName } from "../../../_utilities/queue-display-name.ts";
import {
  cleanConfirmCopy,
  pauseConfirmCopy,
} from "../../_utilities/action-copy.ts";
import { ConfirmActionDialog } from "../confirm-action-dialog/confirm-action-dialog.tsx";

import type { QueueSummary } from "../../../_types/job-queue.ts";

type CleanState = "completed" | "failed";

const CLEAN_STATES: readonly CleanState[] = ["completed", "failed"];

export interface QueueHeaderActionsProps {
  queue: QueueSummary;
  disabled: boolean;
  onPause: () => void;
  onResume: () => void;
  /** Called after the reader confirms. */
  onClean: (state: CleanState) => void;
}

type PendingConfirm = "pause" | CleanState | null;

function getCopy(
  pending: PendingConfirm,
  queue: QueueSummary,
  queueLabel: string,
) {
  if (pending === "pause") {
    return pauseConfirmCopy(queueLabel);
  }

  return pending
    ? cleanConfirmCopy(pending, queue.counts[pending], queueLabel)
    : null;
}

/** Pause or resume the queue, and clean its finished jobs. */
export function QueueHeaderActions({
  queue,
  disabled,
  onPause,
  onResume,
  onClean,
}: QueueHeaderActionsProps) {
  const [pending, setPending] = useState<PendingConfirm>(null);
  const queueLabel = getQueueDisplayName(queue.name);
  const copy = getCopy(pending, queue, queueLabel);

  return (
    <div className="flex flex-wrap items-center gap-2">
      {queue.isPaused ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          onClick={onResume}
        >
          <Play aria-hidden="true" />
          Resume queue
        </Button>
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          onClick={() => {
            setPending("pause");
          }}
        >
          <Pause aria-hidden="true" />
          Pause queue
        </Button>
      )}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button type="button" variant="outline" size="sm" disabled={disabled}>
            Clean
            <ChevronDown aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {CLEAN_STATES.map((state) => (
            <DropdownMenuItem
              key={state}
              disabled={queue.counts[state] === 0}
              onSelect={() => {
                setPending(state);
              }}
            >
              {`Clean ${state} jobs`}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      {copy ? (
        <ConfirmActionDialog
          open
          onOpenChange={(open) => {
            if (!open) {
              setPending(null);
            }
          }}
          copy={copy}
          onConfirm={() => {
            if (pending === "pause") {
              onPause();
            } else if (pending) {
              onClean(pending);
            }
            setPending(null);
          }}
        />
      ) : null}
    </div>
  );
}
