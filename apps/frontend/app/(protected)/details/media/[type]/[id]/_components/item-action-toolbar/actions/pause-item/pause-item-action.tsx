"use client";

import { Pause } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { startTransition } from "react";
import { toast } from "sonner";

import { Button } from "#components/_ui/button.tsx";

import { BaseItemAction } from "../_components/base-item-action";
import { useActionDialog } from "../_hooks/use-action-dialog";
import { pauseItem } from "./_actions/pause-item.action";

interface PauseItemActionProps {
  mediaItemId: string;
  title: string;
}

export function PauseItemAction({ mediaItemId, title }: PauseItemActionProps) {
  const { callbacks, isOpen, setIsOpen } = useActionDialog({
    onSuccess() {
      toast.success("Item paused successfully.");
    },
    onError() {
      toast.error("Failed to pause the item.");
    },
  });

  const { execute, isExecuting, isIdle, reset } = useAction(
    pauseItem.bind(null, mediaItemId),
    callbacks,
  );

  return (
    <BaseItemAction
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(() => {
          if (!open && !isIdle) {
            startTransition(reset);
          }

          return open;
        });
      }}
      isExecuting={isExecuting}
      onSubmit={(event) => {
        event.preventDefault();
        execute();
      }}
      title={`Pausing "${title}"`}
      slots={{
        triggerButton: (
          <Button variant="secondary">
            <Pause />
            Pause
          </Button>
        ),
        submitButtonLabel: "Pause",
      }}
    />
  );
}
