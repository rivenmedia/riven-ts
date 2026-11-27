import { Skeleton } from "#components/_ui/skeleton.tsx";

export default function JobLoading() {
  return (
    <div className="flex flex-col gap-6 p-4 md:p-8" aria-busy="true">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-4 w-56" />
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72 max-w-full" />
      </div>
      <div className="flex flex-wrap items-start gap-5">
        <div className="flex min-w-0 flex-[2_1_520px] flex-col gap-5">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
          <Skeleton className="h-48" />
        </div>
        <div className="flex min-w-0 flex-[1_1_300px] flex-col gap-5">
          <Skeleton className="h-64" />
          <Skeleton className="h-20" />
          <Skeleton className="h-48" />
        </div>
      </div>
    </div>
  );
}
