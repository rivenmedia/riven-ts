import { Badge } from "@/components/_ui/badge";
import { cn } from "@/lib/utils";

import type { MediaItemState } from "@repo/util-plugin-sdk/dto/enums/media-item-state.enum";
import type { HTMLAttributes } from "react";

export interface StatusBadgeProps extends Pick<
  HTMLAttributes<HTMLElement>,
  "className"
> {
  state: MediaItemState;
  small?: boolean;
}

export function StatusBadge({
  state,
  small = false,
  className,
}: StatusBadgeProps) {
  const sizeClasses = small ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-xs";

  return (
    <Badge
      variant="secondary"
      className={cn(
        "inline-flex items-center justify-center backdrop-blur-sm",
        sizeClasses,
        state === "completed" &&
          "bg-emerald-600/80 text-emerald-50 hover:bg-emerald-600/70",
        state === "partially_completed" &&
          "bg-teal-600/80 text-teal-50 hover:bg-teal-600/70",
        state === "scraped" && "bg-sky-600/80 text-sky-50 hover:bg-sky-600/70",
        state === "indexed" &&
          "bg-blue-600/80 text-blue-50 hover:bg-blue-600/70",
        state === "unreleased" &&
          "bg-slate-500/80 text-slate-50 hover:bg-slate-500/70",
        state === "paused" &&
          "bg-slate-500/80 text-slate-50 hover:bg-slate-500/70",
        state === "failed" && "bg-red-600/80 text-red-50 hover:bg-red-600/70",
        className,
      )}
    >
      {state}
    </Badge>
  );
}
