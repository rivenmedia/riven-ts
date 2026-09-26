"use client";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/_ui/alert-dialog";
import { Button } from "@/components/_ui/button";

// import { Loader2 } from "lucide-react";
import { FormProvider, useForm } from "react-hook-form";

import { SeasonSelector } from "../season-selector";

import type { SeasonData } from "../season-selector";
import type { MediaItemType } from "@/app/_types/__generated__/graphql";
import type { LucideIcon } from "lucide-react";
import type { ComponentProps, ReactElement } from "react";

interface RequestItemActionProps extends Pick<
  React.HTMLAttributes<HTMLDivElement>,
  "className"
> {
  title: string | null | undefined;
  ids: (string | null | undefined)[];
  mediaType: MediaItemType;
  seasons: SeasonData[] | null;
  requestedSeasons: Set<number>;
  buttonLabel?: string;
  externalId?: string; // TVDB or TMDB ID
  variant?: ComponentProps<typeof Button>["variant"];
  size?: ComponentProps<typeof Button>["size"];
  onSuccess?: (itemId?: number) => void | Promise<void>;
  buttonIcon?: ReactElement<LucideIcon>;
}

export function RequestItemAction({
  title,
  // ids,
  mediaType,
  seasons,
  requestedSeasons,
  buttonLabel = "Request",
  // externalId,
  variant,
  size,
  className,
  // onSuccess,
}: RequestItemActionProps) {
  const form = useForm({
    defaultValues: {
      requestedSeasons: Object.fromEntries(
        requestedSeasons.values().map((value) => [value.toString(), true]),
      ),
    },
  });

  const {
    formState: { isSubmitting, isDirty },
  } = form;

  const handleSubmit = form.handleSubmit(() => {
    /* empty */
  });

  return (
    // {#if page.data.permissions?.canRequestItems}
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          type="button"
          variant={variant}
          size={size}
          className={className}
        >
          {buttonLabel}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="border border-white/10 bg-zinc-950/95 backdrop-blur-2xl">
        <FormProvider {...form}>
          <form
            onSubmit={(event) => {
              void handleSubmit(event);
            }}
          >
            <AlertDialogHeader>
              <AlertDialogTitle>
                Requesting {`"${title ?? "Media Item"}"`}
              </AlertDialogTitle>
              <AlertDialogDescription>
                This will send a request to Riven to add this media.
              </AlertDialogDescription>
            </AlertDialogHeader>

            {mediaType !== "movie" && seasons && seasons.length > 0 ? (
              <div className="my-4 space-y-2">
                <SeasonSelector
                  seasons={seasons}
                  requestedSeasons={requestedSeasons}
                />
              </div>
            ) : (
              <div className="text-muted-foreground py-4 text-sm">
                This request will be approved automatically.
              </div>
            )}

            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <Button disabled={isSubmitting || !isDirty} type="submit">
                {/* {loading && <Loader2 className="mr-1 inline-block animate-spin" />} */}
                {mediaType !== "movie" && seasons && seasons.length > 0
                  ? "Request Selected"
                  : "Request"}
              </Button>
            </AlertDialogFooter>
          </form>
        </FormProvider>
      </AlertDialogContent>
    </AlertDialog>
    // {/if}
  );
}
