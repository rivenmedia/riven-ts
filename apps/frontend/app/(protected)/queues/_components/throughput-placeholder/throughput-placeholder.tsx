import { cn } from "cn";

import { Button } from "#components/_ui/button.tsx";

export interface ThroughputPlaceholderProps {
  variant: "overview" | "queue";
}

const ranges = ["1h", "24h", "7d", "14d"];

/** Dashed box standing in for the throughput chart until metrics are on. */
export function ThroughputPlaceholder({ variant }: ThroughputPlaceholderProps) {
  const isOverview = variant === "overview";

  return (
    <section
      className={cn(
        "rounded-lg border border-dashed",
        isOverview ? "p-4" : "p-3",
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className={cn("font-medium", isOverview ? "text-base" : "text-sm")}>
          {isOverview ? "Throughput" : "Throughput for this queue"}
        </h2>
        <div className="flex gap-1">
          {ranges.map((range) => (
            <Button
              key={range}
              type="button"
              variant="outline"
              size="xs"
              disabled
            >
              {range}
            </Button>
          ))}
        </div>
      </div>
      <p className="text-muted-foreground mt-2 text-sm">
        {isOverview
          ? "Completed and failed jobs over time. Parked until BullMQ metrics are switched on in the workers."
          : "Parked until BullMQ metrics are switched on."}
      </p>
    </section>
  );
}
