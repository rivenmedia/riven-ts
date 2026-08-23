import { cn } from "@/lib/utils";

import { X, LoaderCircle } from "lucide-react";
import { ViewTransition } from "react";

import { Button } from "../_ui/button";

import type { ComponentType, SVGProps } from "react";

interface SelectionAction {
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  handleClick: () => void;
  variant?: "default" | "destructive";
}

export interface SelectionActionBarProps {
  count: number;
  actions: [SelectionAction, ...SelectionAction[]];
  disabled?: boolean;
  onClear: () => void;
}

export function SelectionActionBar({
  actions,
  count,
  onClear,
  disabled,
}: SelectionActionBarProps) {
  return (
    <ViewTransition enter="slide-in" exit="slide-out">
      <div className="fixed bottom-8 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-3xl border border-white/10 bg-zinc-900/80 p-2 pl-4 shadow-2xl backdrop-blur-xl">
        <div className="mr-4 flex items-center gap-3">
          <div className="bg-primary/20 text-primary flex h-8 w-8 items-center justify-center rounded-xl text-sm font-bold">
            {count}
          </div>
          <span className="text-sm font-medium text-zinc-300">Selected</span>
        </div>
        <div className="mx-1 h-8 w-px bg-white/10" />
        <div className="flex items-center gap-1">
          {actions.map((action) => (
            <Button
              key={action.label}
              variant="ghost"
              size="sm"
              disabled={disabled}
              onClick={action.handleClick}
              className={cn(
                "h-9 gap-2 rounded-xl px-3 transition-all",
                action.variant === "destructive"
                  ? "hover:bg-red-500/20 hover:text-red-400"
                  : "hover:bg-white/10",
              )}
            >
              {disabled ? (
                <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <action.icon className="h-3.5 w-3.5" />
              )}
              {action.label}
            </Button>
          ))}
          <div className="mx-1 h-8 w-px bg-white/10" />
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-xl hover:bg-white/10"
            onClick={onClear}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </ViewTransition>
  );
}
