import { Skeleton } from "../_ui/skeleton";

interface NowPlayingSkeletonProps {
  heightClass: string;
}

export function NowPlayingSkeleton({ heightClass }: NowPlayingSkeletonProps) {
  return (
    <div
      className={`relative w-full overflow-hidden rounded-2xl ${heightClass}`}
    >
      <div className="from-background to-muted absolute inset-0 animate-pulse bg-linear-to-t" />
      <div className="absolute inset-0 z-2 flex flex-col justify-end p-8 md:p-12">
        <div className="w-full max-w-xl">
          <Skeleton className="mb-3 h-12 w-3/4" />
          <div className="flex items-center gap-3">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-5 w-12" />
          </div>
          <Skeleton className="mt-4 h-4 w-full" />
          <Skeleton className="mt-2 h-4 w-4/5" />
          <div className="mt-4 flex gap-2">
            <Skeleton className="h-7 w-20 rounded-full" />
            <Skeleton className="h-7 w-24 rounded-full" />
          </div>
          <div className="mt-6 flex gap-3">
            <Skeleton className="h-11 w-28" />
            <Skeleton className="h-11 w-32" />
          </div>
        </div>
      </div>
    </div>
  );
}
