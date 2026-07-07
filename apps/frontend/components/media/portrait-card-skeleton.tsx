import { cn } from "@/lib/utils";

import { Skeleton } from "../ui/skeleton";

export function PortraitCardSkeleton({
  className,
}: Pick<React.HTMLAttributes<HTMLDivElement>, "className">) {
  return (
    <div
      className={cn(
        "relative aspect-2/3 overflow-hidden rounded-lg bg-zinc-900 shadow-md",
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-0 z-50 rounded-[inherit] border border-white/10"></div>
      <Skeleton className="absolute inset-0 h-full w-full rounded-none" />
      <div className="absolute inset-0 flex flex-col justify-end">
        <div
          className="absolute inset-0 bg-black/90"
          style={{
            maskImage: "linear-gradient(to bottom, transparent 40%, black 90%)",
          }}
        ></div>
        <div className="relative z-10 flex flex-col items-center gap-1.5 p-3">
          <Skeleton className="h-4 w-4/5 rounded" />
          <Skeleton className="h-3 w-1/2 rounded" />
        </div>
      </div>
    </div>
  );
}
