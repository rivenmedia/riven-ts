import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/_ui/chart";
import { Spinner } from "@/components/_ui/spinner";

import { useMemo } from "react";
import { Pie, PieChart } from "recharts";

import type { DashboardStatistics } from "../types";

export interface LibraryChartsCardProps {
  statistics: DashboardStatistics | undefined;
  isLoading: boolean;
}

export function LibraryChartsCard({
  statistics,
  isLoading,
}: LibraryChartsCardProps) {
  const stateRows = useMemo(
    () =>
      Object.entries(statistics?.states ?? {})
        .filter(([, value]) => value > 0)
        .map(([label, value]) => ({ label, value })),
    [statistics?.states],
  );

  const maxStateValue = useMemo(
    () => Math.max(...stateRows.map((item) => item.value), 1),
    [stateRows],
  );

  const contentRows = useMemo(
    () =>
      statistics
        ? [
            ["Movies", statistics.totalMovies, "#ef4444"],
            ["Shows", statistics.totalShows, "#14b8a6"],
            ["Seasons", statistics.totalSeasons, "#60a5fa"],
            ["Episodes", statistics.totalEpisodes, "#f59e0b"],
          ]
            .map(([label, value, color]) => ({
              label: String(label),
              value: Number(value),
              fill: String(color),
            }))
            .toSorted((a, b) => b.value - a.value)
        : [],
    [statistics],
  );

  function renderLegendRows() {
    return (
      <div className="space-y-3">
        {contentRows.map((item) => (
          <div className="flex items-center gap-2" key={item.label}>
            {item.fill && (
              <span
                className="inline-block h-3 w-3 shrink-0 rounded-sm"
                style={{ backgroundColor: item.fill }}
              />
            )}
            <span className="text-sm text-neutral-300">{item.label}</span>
            <span className="ml-auto font-mono text-sm text-neutral-50">
              {item.value.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <section className="border-border/60 grid gap-12 border-b py-8 lg:grid-cols-2">
      <div className="min-w-0">
        <h2 className="text-base font-semibold">Library States</h2>
        <div className="mt-6 space-y-5">
          {isLoading && <Spinner />}
          {stateRows.map((item) => (
            <div key={item.label}>
              <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                <span className="text-neutral-300">{item.label}</span>
                <span className="font-mono text-neutral-50">
                  {item.value.toLocaleString()}
                </span>
              </div>
              <div className="bg-muted h-2 overflow-hidden rounded-full">
                <div
                  className="bg-primary h-full rounded-full"
                  style={{
                    width: `${((item.value / maxStateValue) * 100).toString()}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="min-w-0">
        <h2 className="text-base font-semibold">Content Breakdown</h2>
        <div className="mt-6 grid items-center gap-6 sm:grid-cols-[14rem_minmax(0,1fr)]">
          {isLoading && <Spinner />}
          {contentRows.length === 0 && !isLoading && (
            <p className="text-muted-foreground">No data available</p>
          )}
          {contentRows.length > 0 && !isLoading && (
            <>
              <ChartContainer config={{}} className="mx-auto h-56 w-56">
                <PieChart responsive>
                  <ChartTooltip
                    animationDuration={0}
                    content={<ChartTooltipContent />}
                  />
                  <Pie
                    data={contentRows}
                    dataKey="value"
                    nameKey="label"
                    innerRadius={40}
                    cornerRadius={5}
                    paddingAngle={3}
                  />
                </PieChart>
              </ChartContainer>
              {renderLegendRows()}
            </>
          )}
        </div>
      </div>
    </section>
  );
}
