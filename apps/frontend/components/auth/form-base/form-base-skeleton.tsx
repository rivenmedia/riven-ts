import { Skeleton } from "#components/_ui/skeleton.tsx";

interface FormSectionSkeletonProps {
  fieldCount: number;
}

/** Loading placeholder matching the `FormBase` layout. */
export function FormBaseSkeleton({ fieldCount }: FormSectionSkeletonProps) {
  return (
    <section className="grid gap-4 md:grid-cols-[12rem_minmax(0,1fr)]">
      <div>
        <Skeleton className="h-5 w-32" />
        <Skeleton className="mt-2 h-4 w-full" />
        <Skeleton className="mt-1 h-4 w-3/4" />
      </div>
      <div className="flex min-w-0 flex-col gap-5">
        {Array.from({ length: fieldCount }, (_, i) => i).map((i) => (
          <div key={i} className="flex flex-col gap-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-9 w-full" />
          </div>
        ))}
        <Skeleton className="mt-1 h-8 w-32" />
      </div>
    </section>
  );
}
