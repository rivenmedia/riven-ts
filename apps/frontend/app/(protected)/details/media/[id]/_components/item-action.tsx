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

import { Loader2 } from "lucide-react";

import type { LucideIcon } from "lucide-react";
import type { ComponentProps, ReactElement } from "react";

type ItemActionKind = "reset" | "retry" | "delete" | "pause" | "resume";

const presentation = {
  delete: {
    done: "removed",
    heading: "Deleting",
    label: "Delete",
    verb: "delete",
  },
  pause: {
    done: "done",
    heading: "Pause",
    label: "Pause",
    verb: "pause",
  },
  resume: {
    done: "done",
    heading: "Resume",
    label: "Resume",
    verb: "resume",
  },
  reset: {
    done: "done",
    heading: "Resetting",
    label: "Reset",
    verb: "reset",
  },
  retry: {
    done: "done",
    heading: "Retrying",
    label: "Retry",
    verb: "retry",
  },
} satisfies Record<
  ItemActionKind,
  { heading: string; label: string; verb: string; done: string }
>;

interface ItemActionProps extends Pick<
  React.HTMLAttributes<HTMLElement>,
  "className"
> {
  buttonLabel: string;
  buttonIcon?: ReactElement<LucideIcon>;
  kind: ItemActionKind;
  title: string | null | undefined;
  ids: (string | null | undefined)[];
  size?: ComponentProps<typeof Button>["size"];
  variant?: ComponentProps<typeof Button>["variant"];
  /** Called after a successful reset/retry. */
  onSuccess?: () => void | Promise<void>;
}

export function ItemAction({
  buttonLabel,
  buttonIcon,
  kind,
  title,
  // ids,
  variant,
  size,
  onSuccess,
}: ItemActionProps) {
  const presentationKind = presentation[kind];

  return (
    // {#if page.data.permissions?.canManageLibrary}
    <AlertDialog
    //  bind:open
    >
      <AlertDialogTrigger>
        <Button variant={variant} size={size}>
          {buttonIcon}
          {buttonLabel}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="border border-white/10 bg-zinc-950/95 backdrop-blur-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle>
            {presentationKind.heading} {`"${title ?? "Media Item"}"`}
          </AlertDialogTitle>
          <AlertDialogDescription>{/* {description} */}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <Button
            // disabled={loading}
            onClick={() => {
              confirm();
            }}
          >
            {/* {loading && (
                        <Loader2 className="mr-1 inline-block animate-spin" />
                    )}
                    {presentation.label} */}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    // {/if}
  );
}
