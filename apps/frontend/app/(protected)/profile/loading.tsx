import { Separator } from "#components/_ui/separator.tsx";
import { Skeleton } from "#components/_ui/skeleton.tsx";
import { FormBaseSkeleton } from "#components/auth/form-base/form-base-skeleton.tsx";

export default function ProfileLoading() {
  return (
    <div className="contents" aria-busy="true">
      <section className="border-border/60 flex flex-col gap-5 border-b pb-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-4">
          <Skeleton className="h-16 w-16 shrink-0 rounded-full" />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Skeleton className="h-9 w-64" />
              <Skeleton className="h-5 w-24 rounded-full" />
            </div>
            <Skeleton className="mt-2 h-4 w-48" />
            <div className="mt-3 grid gap-x-6 gap-y-1 sm:grid-cols-2">
              <Skeleton className="h-4 w-44" />
              <Skeleton className="h-4 w-44" />
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Skeleton className="h-9 w-full sm:w-20" />
          <Skeleton className="h-9 w-full sm:w-32" />
        </div>
      </section>
      <FormBaseSkeleton fieldCount={3} />
      <Separator />
      <FormBaseSkeleton fieldCount={1} />
      <Separator />
      <FormBaseSkeleton fieldCount={3} />
      <Separator />
      <FormBaseSkeleton fieldCount={2} />
      <Separator />
      <FormBaseSkeleton fieldCount={1} />
    </div>
  );
}
