import { ResetLibraryDialog } from "./_components/reset-library-dialog";

/**
 * Settings section for destructive actions, such as resetting the library,
 * behind a confirmation dialog.
 */
export function DangerZone() {
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
          <ResetLibraryDialog />
        </div>
      </section>
    </div>
  );
}
