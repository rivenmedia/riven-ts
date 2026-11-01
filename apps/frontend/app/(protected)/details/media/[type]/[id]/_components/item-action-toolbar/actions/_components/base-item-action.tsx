"use client";

import { Loader2 } from "lucide-react";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "#components/_ui/alert-dialog.tsx";
import { Button } from "#components/_ui/button.tsx";

import type {
  ComponentProps,
  ReactElement,
  ReactNode,
  SubmitEventHandler,
} from "react";

export interface BaseItemActionProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isExecuting: boolean;
  /** Called when the dialog's form is submitted. */
  onSubmit: SubmitEventHandler<HTMLFormElement>;
  title: string;
  description?: string;
  slots: {
    triggerButton: ReactElement<ComponentProps<typeof Button>, typeof Button>;
    content?: ReactNode;
    submitButtonLabel: string;
  };
}

export function BaseItemAction({
  open,
  onOpenChange,
  isExecuting,
  onSubmit,
  title,
  description,
  slots: { triggerButton, content, submitButtonLabel },
}: BaseItemActionProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogTrigger asChild>{triggerButton}</AlertDialogTrigger>
      <AlertDialogContent className="border border-white/10 bg-zinc-950/95 backdrop-blur-2xl">
        <form onSubmit={onSubmit}>
          <AlertDialogHeader>
            <AlertDialogTitle>{title}</AlertDialogTitle>
            {description && (
              <AlertDialogDescription>{description}</AlertDialogDescription>
            )}
          </AlertDialogHeader>
          {content}
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button disabled={isExecuting} type="submit">
              {isExecuting && (
                <Loader2 className="mr-1 inline-block animate-spin" />
              )}
              {submitButtonLabel}
            </Button>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
