import { Skeleton } from "#components/_ui/skeleton.tsx";

/** Loading placeholder matching the season and episode details pages. */
export function ShowChildSkeleton() {
  return (
    <div className="relative flex min-h-screen flex-col">
      <div className="mx-auto flex w-full max-w-600 flex-col">
        <div className="px-2 md:px-4">
          <Skeleton className="mb-6 h-[40vh] max-h-150 min-h-87.5 rounded-3xl md:mb-10" />
        </div>
        <div className="grid grid-cols-1 gap-4 px-8 md:px-20 lg:grid-cols-[auto_1fr] lg:gap-6 lg:px-24">
          <Skeleton className="hidden aspect-2/3 w-64 rounded-xl lg:block" />
          <div className="flex flex-col gap-5">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-1/2 lg:h-12" />
            <Skeleton className="h-4 w-1/4" />
          </div>
        </div>
      </div>
    </div>
  );
}
