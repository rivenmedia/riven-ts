"use client";

import { startTransition, useState } from "react";

import { ListItem } from "#components/list-item/list-item.tsx";
import { PortraitCardSkeleton } from "#components/portrait-card/portrait-card-skeleton.tsx";

import { LoadMoreButton } from "./load-more-button.tsx";

import type { ComponentProps } from "react";

interface InfiniteItemGridProps<
  T extends ComponentProps<typeof ListItem>["mediaItem"],
> {
  initialData: Map<string, T>;
  fetchPage: (page: number) => Promise<Map<string, T>>;
  noItemsFoundMessage: string;
}

/**
 * Grid items for a paged list that appends the next page from a Load More
 * button, which also loads automatically when scrolled into view. Render
 * inside `ItemGrid`.
 */
export function InfiniteItemGrid<
  T extends ComponentProps<typeof ListItem>["mediaItem"],
>({ initialData, fetchPage, noItemsFoundMessage }: InfiniteItemGridProps<T>) {
  const [data, setData] = useState<Map<string, T>>(initialData);
  const [page, setPage] = useState(1);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  if (initialData.size === 0) {
    return <p>{noItemsFoundMessage}</p>;
  }

  return (
    <>
      {[...data].map(([key, item]) => (
        <div key={key} className="aspect-2/3 w-full">
          <ListItem
            mediaItem={item}
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
        {hasMore && (
          <LoadMoreButton
            loading={isFetchingMore}
            onLoadMore={() => {
              setIsFetchingMore(true);

              startTransition(async () => {
                const result = await fetchPage(page + 1);
                const newData = new Map([...data, ...result]);
                const hasResults = data.size < newData.size;

                setHasMore(hasResults);

                if (hasResults) {
                  setData((prevData) => new Map([...prevData, ...result]));
                  setPage((prevPage) => prevPage + 1);
                }

                setIsFetchingMore(false);
              });
            }}
          />
        )}
      </div>
    </>
  );
}
