import { cn } from "@/lib/utils";

import type { HTMLAttributes } from "react";

export function PageShell({
  className,
  children,
  ...restProps
}: HTMLAttributes<HTMLElement>) {
  return (
    <main
      className={cn(
        "mt-4 flex flex-col gap-6 p-4 pb-24 md:mt-14 md:gap-8 md:p-8 md:px-16 animate-in fade-in duration-600 slide-in-from-bottom-[20px] ease-[easeOutCubic]",
        className,
      )}
      {...restProps}
    >
      {children}
    </main>
  );
}
