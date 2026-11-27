import { cn } from "cn";

import { formatClockTime } from "../../_utilities/format.ts";

import type { LiveStatus } from "../../_types/job-queue.ts";
import type { ReactNode } from "react";

export interface LiveDataRegionProps {
  status: LiveStatus;
  locale: string;
  children: ReactNode;
}

/** True only when the live connection is established. */
export function isLive(status: LiveStatus) {
  return status.connectionStatus === "connected";
}

/**
 * Wraps live data. While not connected it dims the data and explains that
 * it is stale.
 */
export function LiveDataRegion({
  status,
  locale,
  children,
}: LiveDataRegionProps) {
  const live = isLive(status);

  return (
    <div>
      <div
        className={cn(!live && "opacity-45")}
        aria-busy={live ? undefined : true}
      >
        {children}
      </div>
      {live ? null : (
        <p className="text-muted-foreground mt-2 text-sm">
          {`Showing data from ${formatClockTime(status.lastUpdatedAt, locale)}. Actions are off until Riven reconnects.`}
        </p>
      )}
    </div>
  );
}
