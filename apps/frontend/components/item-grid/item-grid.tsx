import type { PropsWithChildren } from "react";

/**
 * The responsive grid of portrait cards used by the browsing pages.
 */
export function ItemGrid({ children }: PropsWithChildren) {
  return (
    <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 2xl:grid-cols-9">
      {children}
    </div>
  );
}
