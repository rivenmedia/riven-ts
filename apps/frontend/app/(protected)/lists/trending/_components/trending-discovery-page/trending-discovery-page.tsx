"use client";

import { useState } from "react";

import { TrendingListFilters } from "#app/(protected)/lists/trending/_components/trending-list-filters/trending-list-filters.tsx";

import { TrendingDiscoveryItemList } from "./_components/trending-discovery-item-list.tsx";

import type { TrendingListFiltersFormValues } from "#app/(protected)/lists/trending/_components/trending-list-filters/trending-list-filters.form-schema.ts";
import type { ListItem } from "#components/list-item/list-item.tsx";
import type { SortOptionValue } from "../trending-list-filters/constants.ts";
import type { MediaItemType } from "@repo/util-plugin-sdk/dto/enums/media-item-type.enum";
import type { ComponentProps } from "react";

export interface TrendingDiscoveryPageProps<
  T extends ComponentProps<typeof ListItem>["mediaItem"],
> {
  initialData: Map<string, T>;
  fetchPage: (page: number) => Promise<Map<string, T>>;
  emptyMessage: string;
  mediaType: Extract<MediaItemType, "movie" | "show">;
  title: string;
}

export function TrendingDiscoveryPage<
  T extends ComponentProps<typeof ListItem>["mediaItem"],
>({
  initialData,
  fetchPage,
  emptyMessage,
  mediaType,
  title,
}: TrendingDiscoveryPageProps<T>) {
  const [activeFilters, setActiveFilters] =
    useState<TrendingListFiltersFormValues | null>(null);

  // oxlint-disable-next-line no-unused-vars react/hook-use-state
  const [_activeSort, setActiveSort] = useState<SortOptionValue | null>(null);

  return (
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
      <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 2xl:grid-cols-9">
        <TrendingDiscoveryItemList
          initialData={initialData}
          fetchPage={fetchPage}
          noItemsFoundMessage={emptyMessage}
        />
      </div>
    </div>
  );
}
