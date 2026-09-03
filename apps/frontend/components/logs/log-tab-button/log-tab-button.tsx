import { cn } from "@/lib/utils";

export interface LogTabButtonProps {
  name: string;
  isActive: boolean;
  onclick: () => void;
}

export function LogTabButton({ name, isActive, onclick }: LogTabButtonProps) {
  return (
    <button
      className={cn(
        "rounded px-3 py-1.5 text-sm font-medium transition-colors",
        isActive ? "bg-primary/10 text-primary" : "hover:bg-muted/50",
      )}
      onClick={onclick}
    >
      {name}
    </button>
  );
}
