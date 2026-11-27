import { cn } from "cn";

import { LocalTime } from "../local-time/local-time.tsx";

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
      <div className={cn(!live && "opacity-45")}>{children}</div>
      {live ? null : (
        <output className="text-muted-foreground mt-2 block text-sm">
          Showing data from{" "}
          <LocalTime
            iso={status.lastUpdatedAt}
            locale={locale}
            format="clock"
            fallback="the last update"
          />
          . Actions are off until Riven reconnects.
        </output>
      )}
    </div>
  );
}
