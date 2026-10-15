"use client";

import { Trash2 } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { startTransition } from "react";

import { Button } from "#components/_ui/button.tsx";

import { BaseItemAction } from "../_components/base-item-action";
import { useActionDialog } from "../_hooks/use-action-dialog";
import { deleteItem } from "./_actions/delete-item.action";

interface DeleteItemActionProps {
  id: string;
  title: string;
}

export function DeleteItemAction({ id, title }: DeleteItemActionProps) {
  const { callbacks, isOpen, setIsOpen } = useActionDialog();
  const { execute, isExecuting, isIdle, reset } = useAction(
    deleteItem,
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
      title={`Deleting "${title}"`}
      slots={{
        triggerButton: (
          <Button variant="destructive">
            <Trash2 />
            Delete
          </Button>
        ),
        submitButtonLabel: "Delete",
      }}
    />
  );
}
