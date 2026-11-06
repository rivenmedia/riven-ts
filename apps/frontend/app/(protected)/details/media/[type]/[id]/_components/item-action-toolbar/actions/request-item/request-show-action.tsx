"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useHookFormAction } from "@next-safe-action/adapter-react-hook-form/hooks";
import { FormProvider } from "react-hook-form";
import { toast } from "sonner";

import { logger } from "#lib/logger.ts";

import { BaseItemAction } from "../_components/base-item-action";
import { useActionDialog } from "../_hooks/use-action-dialog";
import { requestItem } from "./_actions/request-item.action";
import { SeasonSelector } from "./_components/season-selector";
import { TriggerButton } from "./_components/trigger-button";
import { RequestShowFormSchema } from "./_schemas/request-show.form-schema";

import type { BaseItemActionProps } from "../_components/base-item-action";
import type { ExternalIds } from "./_schemas/external-ids.schema";
import type { ComponentProps } from "react";

interface RequestShowActionProps extends Pick<BaseItemActionProps, "title"> {
  seasons: ComponentProps<typeof SeasonSelector>["seasons"] | null;
  requestedSeasons: Set<number>;
  externalIds: ExternalIds;
}

export function RequestShowAction({
  title,
  externalIds,
  seasons,
  requestedSeasons,
}: RequestShowActionProps) {
  const { isOpen, setIsOpen, callbacks } = useActionDialog({
    onSuccess() {
      toast.success("Request successful!");
    },
    onError() {
      toast.error("Request failed!");
    },
  });

  const { action, form, handleSubmitWithAction } = useHookFormAction(
    requestItem.bind(null, externalIds),
    zodResolver(RequestShowFormSchema),
    {
      formProps: {
        defaultValues: {
          requestedSeasons: Object.fromEntries(
            [...requestedSeasons.values()].map((seasonNumber) => [
              seasonNumber.toString(),
              true,
            ]),
          ),
        },
      },
      actionProps: callbacks,
    },
  );

  if (!seasons) {
    logger.warn(
      "RequestShowAction expected seasons to be available: received null",
    );

    return null;
  }

  return (
    <BaseItemAction
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          form.reset();
        }

        setIsOpen(open);
      }}
      isExecuting={action.isExecuting}
      onSubmit={(event) => void handleSubmitWithAction(event)}
      title={`Requesting "${title}"`}
      description="This will send a request to Riven to add this media."
      slots={{
        triggerButton: (
          <TriggerButton
            label={`Request ${requestedSeasons.size > 0 ? "more" : ""}`.trimEnd()}
          />
        ),
        content: (
          <FormProvider {...form}>
            <div className="my-4 space-y-2">
              <SeasonSelector
                seasons={seasons}
                requestedSeasons={requestedSeasons}
              />
            </div>
          </FormProvider>
        ),
        submitButtonLabel: "Request Selected",
      }}
    />
  );
}
