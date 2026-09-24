import { ImmersiveBackground } from "@/components/immersive-background/immersive-background";
import { PageShell } from "@/components/page-shell/page-shell";
import { PortraitCardSkeleton } from "@/components/portrait-card/portrait-card-skeleton";

import { Suspense, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";

import { TrendingListFilters } from "../trending-list-fiilters/trending-list-filters";
import { TrendingDiscoveryItemList } from "./_components/trending-discovery-item-list";

import type { TrendingListFiltersFormValues } from "../trending-list-fiilters/trending-list-filters.form-schema";
import type { MediaItemType } from "@repo/util-plugin-sdk/dto/enums/media-item-type.enum";

export interface TrendingDiscoveryPageProps {
  emptyMessage: string;
  mediaType: Extract<MediaItemType, "movie" | "show">;
  title: string;
}

export function TrendingDiscoveryPage({
  emptyMessage,
  mediaType,
  title,
}: TrendingDiscoveryPageProps) {
  const [activeFilters, setActiveFilters] =
    useState<TrendingListFiltersFormValues | null>(null);

  // oxlint-disable-next-line react/hook-use-state no-unused-vars
  const [_activeSort, setActiveSort] = useState<string | null>(null);

  return (
    <PageShell className="bg-background relative flex min-h-screen flex-col overflow-x-hidden">
      <ImmersiveBackground />
      <div className="relative z-10 mx-auto flex w-full max-w-600 flex-col gap-6 px-6 pt-6 pb-24 md:px-12 md:pt-16 md:pb-12 lg:px-16">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h1 className="text-foreground text-3xl font-black tracking-tight drop-shadow-md sm:text-4xl lg:text-5xl">
              {title}
            </h1>
            <TrendingListFilters
              hasActiveFilters={Boolean(activeFilters)}
              mediaType={mediaType}
              onApply={setActiveFilters}
              onClear={() => {
                setActiveFilters(null);
              }}
              onSortChange={(value) => {
                setActiveSort(value);
              }}
            />
          </div>
        </div>
        <ErrorBoundary fallback={<p>Something went wrong.</p>}>
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 2xl:grid-cols-9">
            <Suspense
              fallback={[...Array.from({ length: 12 }).keys()].map((i) => (
                <div key={i} className="aspect-2/3 w-full">
                  <PortraitCardSkeleton />
                </div>
              ))}
            >
              <TrendingDiscoveryItemList noItemsFoundMessage={emptyMessage} />
            </Suspense>
          </div>
        </ErrorBoundary>
      </div>
    </PageShell>
  );
}
