import type { HTMLAttributes } from "react";

export interface LogTabButtonProps extends HTMLAttributes<HTMLButtonElement> {
  name: string;
}

export function LogTabButton({ name, onClick, ...props }: LogTabButtonProps) {
  return (
    <button
      {...props}
      className="rounded px-3 py-1.5 text-sm font-medium transition-colors aria-selected:bg-primary/10 aria-selected:text-primary hover:not-aria-selected:bg-muted/50"
      type="button"
    >
      {name}
    </button>
  );
}
