import { RefreshCw } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { startTransition } from "react";
import { toast } from "sonner";

import { Button } from "#components/_ui/button.tsx";

import { BaseItemAction } from "../_components/base-item-action";
import { useActionDialog } from "../_hooks/use-action-dialog";
import { retryItem } from "./_actions/retry-item.action";

interface RetryItemActionProps {
  mediaItemId: string;
  title: string;
}

export function RetryItemAction({ mediaItemId, title }: RetryItemActionProps) {
  const { callbacks, isOpen, setIsOpen } = useActionDialog({
    onError() {
      toast.error("Failed to retry the item.");
    },
    onSuccess() {
      toast.success("Item retried successfully.");
    },
  });

  const { execute, isExecuting, isIdle, reset } = useAction(
    retryItem.bind(null, mediaItemId),
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
      title={`Retrying "${title}"`}
      slots={{
        triggerButton: (
          <Button variant="secondary">
            <RefreshCw />
            Retry
          </Button>
        ),
        submitButtonLabel: "Retry",
      }}
    />
  );
}
