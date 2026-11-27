"use client";

import { Link2, RotateCcw, Trash } from "lucide-react";
import { useState } from "react";

import { Button } from "#components/_ui/button.tsx";

import { ConfirmActionDialog } from "../../../../_components/confirm-action-dialog/confirm-action-dialog.tsx";
import { removeConfirmCopy } from "../../../../_utilities/action-copy.ts";

export interface JobHeaderActionsProps {
  jobId: string;
  queueLabel: string;
  canRetry: boolean;
  canRemove: boolean;
  disabled: boolean;
  onRetry: () => void;
  onRemove: () => void;
  onCopyLink: () => void;
}

/** Retry, Remove (after confirming) and Copy link for one job. */
export function JobHeaderActions({
  jobId,
  queueLabel,
  canRetry,
  canRemove,
  disabled,
  onRetry,
  onRemove,
  onCopyLink,
}: JobHeaderActionsProps) {
  const [isRemoveOpen, setIsRemoveOpen] = useState(false);

  return (
    <>
      {canRetry ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          onClick={onRetry}
        >
          <RotateCcw aria-hidden="true" />
          Retry
        </Button>
      ) : null}
      {canRemove ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          onClick={() => {
            setIsRemoveOpen(true);
          }}
        >
          <Trash aria-hidden="true" />
          Remove
        </Button>
      ) : null}
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={disabled}
        onClick={onCopyLink}
      >
        <Link2 aria-hidden="true" />
        Copy link
      </Button>
      {canRemove ? (
        <ConfirmActionDialog
          open={isRemoveOpen}
          onOpenChange={setIsRemoveOpen}
          copy={removeConfirmCopy([jobId], queueLabel)}
          onConfirm={onRemove}
        />
      ) : null}
    </>
  );
}
