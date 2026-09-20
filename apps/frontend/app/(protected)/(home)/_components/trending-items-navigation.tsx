import { Button } from "@/components/_ui/button";
import { AnimatedToggle } from "@/components/animated-toggle/animated-toggle";

import Link from "next/link";

import type { Route } from "next";

interface TrendingItemsNavigationProps {
  setTimeWindow: (newTimeWindow: string) => void;
  viewAllHref: Route;
}

export function TrendingItemsNavigation({
  setTimeWindow,
  viewAllHref,
}: TrendingItemsNavigationProps) {
  return (
    <div className="flex items-center gap-3">
      <AnimatedToggle
        options={[
          { label: "Today", value: "day" },
          { label: "This Week", value: "week" },
        ]}
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
    </div>
  );
}
