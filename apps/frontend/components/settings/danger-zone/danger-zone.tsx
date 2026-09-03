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
} from "@/components/_ui/alert-dialog";
import { Button } from "@/components/_ui/button";

import { Loader2 } from "lucide-react";
import { useState } from "react";

export function DangerZone() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  function resetLibrary() {
    setIsLoading(true);

    console.log("Resetting library...");

    setIsLoading(false);
    setIsOpen(false);
  }

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <div>
          <h2 className="text-destructive text-lg font-semibold tracking-tight">
            Danger zone
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Destructive actions. These cannot be undone.
          </p>
        </div>

        <div className="border-destructive/30 flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="font-medium">Reset library</p>
            <p className="text-muted-foreground text-sm">
              Removes all media items, streams, downloads and requests. Your
              settings, plugin configuration and ranking profiles are preserved.
              Files already on disk are not deleted.
            </p>
          </div>

          <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
            <AlertDialogTrigger>
              <Button
                variant="destructive"
                className="shrink-0 w-full"
                type="button"
              >
                Reset library
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="border border-white/10 bg-zinc-950/95 backdrop-blur-2xl">
              <AlertDialogHeader>
                <AlertDialogTitle>Reset the entire library?</AlertDialogTitle>
                <AlertDialogDescription>
                  This permanently removes every media item, stream, download
                  and request from Riven&apos;s database. Your setup (settings,
                  plugins, ranking profiles) is kept. On-disk files are left
                  untouched. This cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isLoading}>
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  disabled={isLoading}
                  onClick={() => {
                    resetLibrary();
                  }}
                >
                  {isLoading && (
                    <Loader2 className="mr-1 inline-block animate-spin" />
                  )}
                  Reset library
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </section>
    </div>
  );
}
