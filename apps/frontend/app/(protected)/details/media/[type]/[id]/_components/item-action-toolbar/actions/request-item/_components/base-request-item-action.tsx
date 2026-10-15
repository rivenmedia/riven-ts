"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useHookFormAction } from "@next-safe-action/adapter-react-hook-form/hooks";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { FormProvider } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

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

import { requestItem } from "../_actions/request-item.action";

import type { ExternalIds } from "@repo/util-plugin-sdk/schemas/external-ids.type";
import type { ComponentProps, ReactElement, ReactNode } from "react";

export interface BaseRequestItemActionProps {
  externalIds: ExternalIds;
  title: string;
  defaultFormValues?: Record<string, unknown>;
  slots: {
    triggerButton: ReactElement<ComponentProps<typeof Button>, typeof Button>;
    content: ReactNode;
    requestButtonLabel: string;
  };
}

export function BaseRequestItemAction({
  externalIds,
  title,
  defaultFormValues,
  slots: { triggerButton, content, requestButtonLabel },
}: BaseRequestItemActionProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { form, handleSubmitWithAction } = useHookFormAction(
    requestItem.bind(null, externalIds),
    zodResolver(z.record(z.string(), z.unknown())),
    {
      formProps: {
        defaultValues: defaultFormValues ?? {},
      },
      actionProps: {
        onSuccess: () => {
          toast.success("Request successful!");
          setIsDialogOpen(false);
        },
        onError: () => {
          toast.error("Request failed!");
        },
      },
    },
  );

  const {
    formState: { isSubmitting, isValid },
  } = form;

  return (
    // {#if page.data.permissions?.canRequestItems}
    <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <AlertDialogTrigger asChild>{triggerButton}</AlertDialogTrigger>
      <AlertDialogContent className="border border-white/10 bg-zinc-950/95 backdrop-blur-2xl">
        <FormProvider {...form}>
          <form onSubmit={(event) => void handleSubmitWithAction(event)}>
            <AlertDialogHeader>
              <AlertDialogTitle>Requesting {`"${title}"`}</AlertDialogTitle>
              <AlertDialogDescription>
                This will send a request to Riven to add this media.
              </AlertDialogDescription>
            </AlertDialogHeader>
            {content}
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <Button disabled={isSubmitting || !isValid} type="submit">
                {isSubmitting && (
                  <Loader2 className="mr-1 inline-block animate-spin" />
                )}
                {requestButtonLabel}
              </Button>
            </AlertDialogFooter>
          </form>
        </FormProvider>
      </AlertDialogContent>
    </AlertDialog>
    // {/if}
  );
}
