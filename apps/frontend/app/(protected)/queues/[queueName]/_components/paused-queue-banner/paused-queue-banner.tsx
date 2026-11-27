import { Button } from "#components/_ui/button.tsx";

export interface PausedQueueBannerProps {
  queueLabel: string;
  disabled: boolean;
  onResume: () => void;
}

/** Tells the reader a queue is paused and offers to resume it. */
export function PausedQueueBanner({
  queueLabel,
  disabled,
  onResume,
}: PausedQueueBannerProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-700/50 bg-amber-700/10 p-4">
      <div>
        <p className="font-medium">{`${queueLabel} is paused`}</p>
        <p className="text-muted-foreground text-sm">
          New jobs wait here until you resume it.
        </p>
      </div>
      <Button
        type="button"
        variant="outline"
        disabled={disabled}
        onClick={onResume}
      >
        Resume queue
      </Button>
    </div>
  );
}
