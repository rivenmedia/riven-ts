import Link from "next/link";

import { Button } from "#components/_ui/button.tsx";
import { AnimatedToggle } from "#components/animated-toggle/animated-toggle.tsx";

import type { ToggleOption } from "#components/animated-toggle/animated-toggle.tsx";
import type { Route } from "next";
import type { HTMLAttributes } from "react";

export const TRENDING_TIME_OPTIONS = [
  {
    label: "Today",
    value: "day",
  },
  {
    label: "This Week",
    value: "week",
  },
] as const satisfies readonly ToggleOption[];

export type TimeWindow = (typeof TRENDING_TIME_OPTIONS)[number]["value"];

interface TrendingItemsActionsProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  "className"
> {
  setTimeWindow: (newTimeWindow: TimeWindow) => void;
  viewAllHref: Route;
}

export function TrendingItemsActions({
  setTimeWindow,
  viewAllHref,
  ...props
}: TrendingItemsActionsProps) {
  return (
    <section className="flex items-center gap-3" {...props}>
      <AnimatedToggle
        options={TRENDING_TIME_OPTIONS}
        onChange={(newTimeWindow) => {
          setTimeWindow(newTimeWindow);
        }}
      />
      <Button
        asChild
        className="text-muted-foreground border-white/10 bg-black/20 hover:bg-black/40 hover:text-foreground h-9 w-24 rounded-xl border text-xs font-bold backdrop-blur-md shadow-inner transition-all"
        variant="ghost"
        type="button"
      >
        <Link href={viewAllHref}>View All</Link>
      </Button>
    </section>
  );
}
