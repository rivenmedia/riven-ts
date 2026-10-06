"use client";

import { SectionHeading } from "@/components/media/section-heading/section-heading";

import { useState } from "react";

import {
  TRENDING_TIME_OPTIONS,
  TrendingItemsActions,
} from "./trending-items-actions";

import type { TimeWindow } from "./trending-items-actions";
import type { Route } from "next";
import type { ReactNode } from "react";

interface TrendingTimeWindowSectionProps {
  title: string;
  viewAllHref: Route;
  slots: Record<TimeWindow, ReactNode>;
}

/**
 * Client shell which owns the selected time window and swaps between
 * server-rendered slots, so toggling never triggers a refetch.
 */
export function TrendingTimeWindowSection({
  title,
  viewAllHref,
  slots,
}: TrendingTimeWindowSectionProps) {
  const [timeWindow, setTimeWindow] = useState<TimeWindow>(
    TRENDING_TIME_OPTIONS[0].value,
  );

  return (
    <>
      <div className="mb-1 flex items-center justify-between">
        <SectionHeading title={title} />
        <TrendingItemsActions
          aria-label={`${title} actions`}
          setTimeWindow={(newTimeWindow) => {
            setTimeWindow(newTimeWindow);
          }}
          viewAllHref={viewAllHref}
        />
      </div>
      {slots[timeWindow]}
    </>
  );
}
