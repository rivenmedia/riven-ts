import { Button } from "#components/_ui/button.tsx";
import { ConnectionStatusIndicator } from "#components/connection-status-indicator/connection-status-indicator.tsx";

import type { LiveStatus } from "../../_types/job-queue.ts";

export interface LiveControlsProps {
  status: LiveStatus;
  isUpdatesPaused: boolean;
  onUpdatesPausedChange: (next: boolean) => void;
}

/** Connection indicator and a toggle to pause live updates. */
export function LiveControls({
  status,
  isUpdatesPaused,
  onUpdatesPausedChange,
}: LiveControlsProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <ConnectionStatusIndicator
        connectionStatus={status.connectionStatus}
        reconnectAttempts={status.reconnectAttempts}
        maxReconnectAttempts={status.maxReconnectAttempts}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        aria-pressed={isUpdatesPaused}
        onClick={() => {
          onUpdatesPausedChange(!isUpdatesPaused);
        }}
      >
        {isUpdatesPaused ? "Resume updates" : "Pause updates"}
      </Button>
    </div>
  );
}
