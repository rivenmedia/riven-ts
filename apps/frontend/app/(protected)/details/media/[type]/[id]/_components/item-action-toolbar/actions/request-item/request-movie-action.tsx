"use client";

import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";

import { BaseItemAction } from "../_components/base-item-action";
import { useActionDialog } from "../_hooks/use-action-dialog";
import { requestItem } from "./_actions/request-item.action";
import { TriggerButton } from "./_components/trigger-button";

import type { BaseItemActionProps } from "../_components/base-item-action";
import type { ExternalIds } from "./_schemas/external-ids.schema";

type RequestMovieActionProps = Pick<BaseItemActionProps, "title"> & {
  externalIds: ExternalIds;
};

export function RequestMovieAction({
  title,
  externalIds,
}: RequestMovieActionProps) {
  const { isOpen, setIsOpen, callbacks } = useActionDialog({
    onSuccess() {
      toast.success("Request successful!");
    },
    onError() {
      toast.error("Request failed!");
    },
  });

  const { execute, isExecuting } = useAction(
    requestItem.bind(null, externalIds),
    callbacks,
  );

  return (
    <BaseItemAction
      open={isOpen}
      onOpenChange={setIsOpen}
      isExecuting={isExecuting}
      onSubmit={(event) => {
        event.preventDefault();
        execute({});
      }}
      title={`Requesting "${title}"`}
      description="This will send a request to Riven to add this media."
      slots={{
        content: (
          <div className="text-muted-foreground py-4 text-sm">
            This request will be approved automatically.
          </div>
        ),
        triggerButton: <TriggerButton label="Request" />,
        submitButtonLabel: "Request",
      }}
    />
  );
}
