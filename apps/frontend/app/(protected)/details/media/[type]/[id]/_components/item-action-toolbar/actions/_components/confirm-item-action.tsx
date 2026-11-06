"use client";

import { useAction } from "next-safe-action/hooks";
import { startTransition } from "react";
import { toast } from "sonner";

import { Button } from "#components/_ui/button.tsx";

import { useActionDialog } from "../_hooks/use-action-dialog";
import { BaseItemAction } from "./base-item-action";

import type { SingleInputActionFn } from "next-safe-action/hooks";
import type { ComponentProps, ReactNode } from "react";

export interface ConfirmItemActionProps {
  /** The action to execute once confirmed, with its target ID already bound. */
  action: SingleInputActionFn<unknown, undefined, unknown, unknown>;
  title: string;
  label: string;
  icon: ReactNode;
  variant?: ComponentProps<typeof Button>["variant"];
  successMessage: string;
  errorMessage: string;
}

/**
 * An item action that needs no input beyond confirming it in a dialog.
 */
export function ConfirmItemAction({
  action,
  title,
  label,
  icon,
  variant = "secondary",
  successMessage,
  errorMessage,
}: ConfirmItemActionProps) {
  const { callbacks, isOpen, setIsOpen } = useActionDialog({
    onSuccess() {
      toast.success(successMessage);
    },
    onError() {
      toast.error(errorMessage);
    },
  });

  const { execute, isExecuting, isIdle, reset } = useAction(action, callbacks);

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
      title={title}
      slots={{
        triggerButton: (
          <Button variant={variant}>
            {icon}
            {label}
          </Button>
        ),
        submitButtonLabel: label,
      }}
    />
  );
}
