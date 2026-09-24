import { cn } from "cn";

import { fly } from "../_animations/fly";

import type { HTMLAttributes } from "react";

export function PageShell({
  className,
  children,
  ...restProps
}: HTMLAttributes<HTMLElement>) {
  return (
    <main
      className={cn(
        "mt-4 flex flex-col gap-6 p-4 pb-24 md:mt-14 md:gap-8 md:p-8 md:px-16 duration-600",
        fly,
        className,
      )}
      {...restProps}
    >
      {children}
    </main>
  );
}
