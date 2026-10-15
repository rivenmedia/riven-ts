"use client";

import { Pause } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { startTransition } from "react";

import { Button } from "#components/_ui/button.tsx";

import { BaseItemAction } from "../_components/base-item-action";
import { useActionDialog } from "../_hooks/use-action-dialog";
import { pauseItem } from "./_actions/pause-item.action";

interface PauseItemActionProps {
  id: string;
  title: string;
}

export function PauseItemAction({ id, title }: PauseItemActionProps) {
  const { callbacks, isOpen, setIsOpen } = useActionDialog();
  const { execute, isExecuting, isIdle, reset } = useAction(
    pauseItem,
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
        execute({ id });
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
