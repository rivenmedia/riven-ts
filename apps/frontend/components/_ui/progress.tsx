"use client";

import { cn } from "cn";
import { Progress as ProgressPrimitive } from "radix-ui";
import * as React from "react";

/**
 * Displays an indicator showing the completion progress of a task, typically
 * displayed as a progress bar.
 */
function Progress({
  className,
  value,
  max = 100,
  ...props
}: React.ComponentProps<typeof ProgressPrimitive.Root>) {
  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      className={cn(
        "relative flex h-1 w-full items-center overflow-x-hidden rounded-full bg-muted",
        className,
      )}
      value={value}
      max={max}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className="h-full bg-primary transition-[width] rounded-full"
        style={{
          width: `${((value ?? 0) / max) * 100}%`,
        }}
      />
    </ProgressPrimitive.Root>
  );
}

export { Progress };
