import { Skeleton } from "#components/_ui/skeleton.tsx";

const tileKeys = ["active", "waiting", "scheduled", "failed"];
const rowKeys = Array.from(
  { length: 10 },
  (_, index) => `row-${index.toString()}`,
);

export default function QueuesLoading() {
  return (
    <div className="flex flex-col gap-6 p-4 md:p-8" aria-busy="true">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
        {tileKeys.map((key) => (
          <Skeleton key={key} className="h-20" />
        ))}
      </div>
      <div className="flex flex-col gap-2">
        {rowKeys.map((key) => (
          <Skeleton key={key} className="h-12" />
        ))}
      </div>
    </div>
  );
}
