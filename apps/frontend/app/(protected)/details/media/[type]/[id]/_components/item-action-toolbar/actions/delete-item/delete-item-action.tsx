"use client";

import { Trash2 } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { startTransition } from "react";
import { toast } from "sonner";

import { Button } from "#components/_ui/button.tsx";

import { BaseItemAction } from "../_components/base-item-action";
import { useActionDialog } from "../_hooks/use-action-dialog";
import { deleteItem } from "./_actions/delete-item.action";

interface DeleteItemActionProps {
  mediaItemId: string;
  title: string;
}

export function DeleteItemAction({
  mediaItemId,
  title,
}: DeleteItemActionProps) {
  const { callbacks, isOpen, setIsOpen } = useActionDialog({
    onSuccess() {
      toast.success("Item deleted successfully");
    },
    onError() {
      toast.error("Failed to delete item");
    },
  });

  const { execute, isExecuting, isIdle, reset } = useAction(
    deleteItem.bind(null, mediaItemId),
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
