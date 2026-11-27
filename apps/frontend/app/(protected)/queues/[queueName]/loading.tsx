import { Skeleton } from "#components/_ui/skeleton.tsx";

const tabKeys = Array.from(
  { length: 8 },
  (_, index) => `tab-${index.toString()}`,
);
const rowKeys = Array.from(
  { length: 10 },
  (_, index) => `row-${index.toString()}`,
);

export default function QueueLoading() {
  return (
    <div className="flex flex-col gap-6 p-4 md:p-8" aria-busy="true">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      <Skeleton className="h-20" />
      <div className="flex gap-2 overflow-hidden">
        {tabKeys.map((key) => (
          <Skeleton key={key} className="h-9 w-28 shrink-0" />
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
