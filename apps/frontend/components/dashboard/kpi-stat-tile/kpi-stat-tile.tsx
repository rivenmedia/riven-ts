import { cn } from "@/lib/utils";

export interface KpiStatTileProps {
  title: string;
  value: string | undefined;
  tone?: "default" | "warning";
}

export function KpiStatTile({
  title,
  value = "N/A",
  tone = "default",
}: KpiStatTileProps) {
  return (
    <div
      className={cn(
        "border-border/60 border-b py-5",
        tone === "warning" && "border-amber-600/30",
      )}
    >
      <p className="text-sm font-medium text-neutral-300">{title}</p>
      <div
        className={cn(
          "mt-3 text-2xl font-semibold tracking-tight",
          tone === "warning" ? "text-amber-300" : "text-neutral-50",
        )}
      >
        {value}
      </div>
    </div>
  );
}
