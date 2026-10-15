"use client";

import { Play } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { startTransition } from "react";

import { Button } from "#components/_ui/button.tsx";

import { BaseItemAction } from "../_components/base-item-action";
import { useActionDialog } from "../_hooks/use-action-dialog";
import { resumeItem } from "./_actions/resume-item.action";

interface ResumeItemActionProps {
  id: string;
  title: string;
}

export function ResumeItemAction({ id, title }: ResumeItemActionProps) {
  const { callbacks, isOpen, setIsOpen } = useActionDialog();
  const { execute, isExecuting, isIdle, reset } = useAction(
    resumeItem,
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
      title={`Resuming "${title}"`}
      slots={{
        triggerButton: (
          <Button variant="secondary">
            <Play />
            Resume
          </Button>
        ),
        submitButtonLabel: "Resume",
      }}
    />
  );
}
