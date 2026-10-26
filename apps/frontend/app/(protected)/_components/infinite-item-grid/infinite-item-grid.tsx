"use client";

import { cn } from "cn";
import { startTransition, useState } from "react";

import { fly } from "#components/_animations/fly.ts";
import { ListItem } from "#components/list-item/list-item.tsx";
import { PortraitCardSkeleton } from "#components/portrait-card/portrait-card-skeleton.tsx";

import { LoadMoreButton } from "./load-more-button.tsx";

import type { ComponentProps } from "react";

type ListItemProps = ComponentProps<typeof ListItem>;

interface InfiniteItemGridProps<T extends ListItemProps["mediaItem"]> {
  initialData: Map<string, T>;
  fetchPage: (page: number) => Promise<Map<string, T>>;
  noItemsFoundMessage: string;
  /**
   * Builds each item's details link. Defaults to
   * `/details/media/{type}/{id}`.
   */
  getItemHref?: (item: T) => NonNullable<ListItemProps["href"]>;
  /**
   * Allows items to be selected. Requires a `CardSelectionProvider` ancestor.
   */
  isSelectable?: boolean;
  /**
   * Flies each page's items in with a staggered delay as they load.
   */
  isAnimated?: boolean;
}

const getDefaultItemHref = (item: ListItemProps["mediaItem"]) =>
  `/details/media/${item.type}/${item.id}` as const;

/**
 * Grid items for a paged list that appends the next page from a Load More
 * button, which also loads automatically when scrolled into view. Render
 * inside `ItemGrid`.
 */
export function InfiniteItemGrid<T extends ListItemProps["mediaItem"]>({
  initialData,
  fetchPage,
  noItemsFoundMessage,
  getItemHref = getDefaultItemHref,
  isSelectable = false,
  isAnimated = false,
}: InfiniteItemGridProps<T>) {
  // Kept per page so each page's animation is staggered from its own first item
  const [loadedPages, setLoadedPages] = useState<Map<string, T>[]>([
    initialData,
  ]);
  const [page, setPage] = useState(1);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  if (initialData.size === 0) {
    return <p>{noItemsFoundMessage}</p>;
  }

  return (
    <>
      {loadedPages.flatMap((pageItems) =>
        [...pageItems].map(([key, item], index) => (
          <div
            key={key}
            className={cn(
              "aspect-2/3 w-full",
              isAnimated && ["animation-duration-700", fly],
            )}
            style={
              isAnimated
                ? { animationDelay: `${(index * 30).toString()}ms` }
                : undefined
            }
          >
            <ListItem
              mediaItem={item}
              href={getItemHref(item)}
              isSelectable={isSelectable}
            />
          </div>
        )),
      )}
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
                const newItems = new Map(
                  [...result].filter(
                    ([key]) =>
                      !loadedPages.some((pageItems) => pageItems.has(key)),
                  ),
                );
                const hasResults = newItems.size > 0;

                setHasMore(hasResults);

                if (hasResults) {
                  setLoadedPages((prevPages) => [...prevPages, newItems]);
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
