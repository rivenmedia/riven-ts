"use client";

import { RefreshCw } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { startTransition } from "react";

import { Button } from "#components/_ui/button.tsx";

import { BaseItemAction } from "../_components/base-item-action";
import { useActionDialog } from "../_hooks/use-action-dialog";
import { resetItem } from "./_actions/reset-item.action";

interface ResetItemActionProps {
  id: string;
  title: string;
}

export function ResetItemAction({ id, title }: ResetItemActionProps) {
  const { callbacks, isOpen, setIsOpen } = useActionDialog();
  const { execute, isExecuting, isIdle, reset } = useAction(
    resetItem.bind(null, id),
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
      title={`Resetting "${title}"`}
      slots={{
        triggerButton: (
          <Button variant="secondary">
            <RefreshCw />
            Reset
          </Button>
        ),
        submitButtonLabel: "Reset",
      }}
    />
  );
}
