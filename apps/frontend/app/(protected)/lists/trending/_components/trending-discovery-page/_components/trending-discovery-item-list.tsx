"use client";

import { startTransition, useState } from "react";

import { ListItem } from "#components/list-item/list-item.tsx";
import { PortraitCardSkeleton } from "#components/portrait-card/portrait-card-skeleton.tsx";

import { LoadMoreButton } from "./load-more-button.tsx";

import type { ComponentProps } from "react";

interface TrendingDiscoveryItemListProps<
  T extends ComponentProps<typeof ListItem>["mediaItem"],
> {
  initialData: Map<string, T>;
  fetchPage: (page: number) => Promise<Map<string, T>>;
  noItemsFoundMessage: string;
}

export function TrendingDiscoveryItemList<
  T extends ComponentProps<typeof ListItem>["mediaItem"],
>({
  initialData,
  fetchPage,
  noItemsFoundMessage,
}: TrendingDiscoveryItemListProps<T>) {
  const [data, setData] = useState<Map<string, T>>(initialData);
  const [page, setPage] = useState(1);
  const [isFetchingMore, setIsFetchingMore] = useState(false);

  if (initialData.size === 0) {
    return <p>{noItemsFoundMessage}</p>;
  }

  return (
    <>
      {[...data.values()].map((item) => (
        <div key={item.id} className="aspect-2/3 w-full">
          <ListItem
            mediaItem={item}
            indexer=""
            href={`/details/media/${item.type}/${item.id}`}
          />
        </div>
      ))}
      {isFetchingMore &&
        [...Array.from({ length: 12 }).keys()].map((i) => (
          <div key={i} className="aspect-2/3 w-full">
            <PortraitCardSkeleton />
          </div>
        ))}
      <div className="flex justify-center mt-4 col-span-full">
        <LoadMoreButton
          loading={isFetchingMore}
          onLoadMore={() => {
            setIsFetchingMore(true);

            startTransition(async () => {
              const result = await fetchPage(page + 1);

              setData((prevData) => new Map([...prevData, ...result]));
              setIsFetchingMore(false);
              setPage((prevPage) => prevPage + 1);
            });
          }}
        />
      </div>
    </>
  );
}
