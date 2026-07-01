import { Button } from "@/components/ui/button";

interface SetupReviewStepProps {
  validPluginCount: number;
  enabledProfileCount: number;
  readyToComplete: boolean;
  blockers: string[];
  finishSetup: () => void;
}

export function SetupReviewStep({
  validPluginCount,
  enabledProfileCount,
  readyToComplete,
  blockers,
  finishSetup,
}: SetupReviewStepProps) {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-semibold tracking-tight">
          Review and Finish
        </h2>
        <p className="text-muted-foreground mt-3 max-w-3xl text-sm">
          You can continue tuning things later in Settings, but this is the
          point where the instance should be usable.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border p-5">
          <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            Valid Plugins
          </p>
          <p className="mt-2 text-3xl font-semibold">{validPluginCount}</p>
        </div>
        <div className="rounded-2xl border p-5">
          <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            Enabled Profiles
          </p>
          <p className="mt-2 text-3xl font-semibold">{enabledProfileCount}</p>
        </div>
        <div className="rounded-2xl border p-5">
          <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            Status
          </p>
          <p className="mt-2 text-3xl font-semibold">
            {readyToComplete ? "Ready" : "Review"}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border p-5">
        {readyToComplete ? (
          <>
            <p className="font-medium">Everything looks ready.</p>
            <p className="text-muted-foreground mt-2 text-sm">
              Your instance has the minimum configuration needed to start.
            </p>
          </>
        ) : (
          <>
            <p className="font-medium">Before finishing</p>
            <ul className="text-muted-foreground mt-3 space-y-2 text-sm">
              {blockers.map((blocker) => (
                <li key={blocker}>{blocker}</li>
              ))}
            </ul>
          </>
        )}
      </div>

      <div className="flex justify-end">
        <Button type="button" disabled={!readyToComplete} onClick={finishSetup}>
          Finish setup
        </Button>
      </div>
    </div>
  );
}
