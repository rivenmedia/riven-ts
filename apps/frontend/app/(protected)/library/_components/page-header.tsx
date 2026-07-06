import { LibrarySearchForm } from "./search-form";

interface PageHeaderProps {
  totalItems: number;
}

export function PageHeader({ totalItems }: PageHeaderProps) {
  return (
    <header className="flex flex-col justify-between gap-6 pt-32 md:flex-row md:items-end md:pt-0">
      <div className="space-y-2">
        <h1 className="font-serif text-5xl font-medium tracking-tight text-white/90 md:text-7xl">
          Library
        </h1>
        <div className="flex items-center gap-2 text-zinc-400">
          <span className="font-mono text-xs tracking-widest uppercase">
            Index
          </span>
          <span className="h-px w-8 bg-zinc-800"></span>
          <span className="text-primary font-mono text-sm">
            {totalItems.toLocaleString()} items
          </span>
        </div>
      </div>

      <LibrarySearchForm />
    </header>
  );
}
