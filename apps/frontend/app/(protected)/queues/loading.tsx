import { Skeleton } from "#components/_ui/skeleton.tsx";

const tileKeys = ["active", "waiting", "scheduled", "failed"];
const sections = [
  { key: "flows", rows: 3 },
  { key: "sandboxed", rows: 2 },
  { key: "plugins", rows: 4 },
].map(({ key, rows }) => ({
  key,
  rowKeys: Array.from(
    { length: rows },
    (_, index) => `${key}-${index.toString()}`,
  ),
}));

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
      <Skeleton className="h-32" />
      <div className="flex flex-col gap-4">
        {sections.map((section) => (
          <div key={section.key} className="flex flex-col gap-2">
            <Skeleton className="h-6 w-48" />
            {section.rowKeys.map((key) => (
              <Skeleton key={key} className="h-12" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
