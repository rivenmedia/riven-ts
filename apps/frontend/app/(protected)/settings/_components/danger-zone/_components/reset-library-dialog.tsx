"use client";

import { Loader2 } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "#components/_ui/alert-dialog.tsx";
import { Button } from "#components/_ui/button.tsx";

import { resetLibrary } from "../_actions/reset-library.action";

export function ResetLibraryDialog() {
  const { execute: executeResetLibrary, isIdle } = useAction(resetLibrary, {
    onError() {
      toast.error("Failed to reset library.");
    },
    onSuccess() {
      toast.success("Library successfully reset!");
    },
  });

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" type="button">
          Reset library
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="border border-white/10 bg-zinc-950/95 backdrop-blur-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle>Reset the entire library?</AlertDialogTitle>
          <AlertDialogDescription>
            This permanently removes every media item, stream, download and
            request from Riven&apos;s database. Your setup (settings, plugins,
            ranking profiles) is kept. On-disk files are left untouched. This
            cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={!isIdle}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={!isIdle}
            onClick={() => {
              executeResetLibrary();
            }}
          >
            {!isIdle && <Loader2 className="mr-1 inline-block animate-spin" />}
            Reset library
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
