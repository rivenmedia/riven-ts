import { ListItem } from "@/components/media/list-item";

import { LibraryPagination } from "./pagination";

import type { GetLibraryItemsQuery } from "../_queries/get-library-items.query.typegen";

interface ItemsListProps {
  items: GetLibraryItemsQuery["mediaItems"];
}

export function ItemsList({ items }: ItemsListProps) {
  return (
    <>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 md:gap-6 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7">
        {items.map((item, i) => (
          <div
            key={item.id}
            className="animate-in fade-in slide-in-from-bottom-4 fill-mode-backwards duration-700"
            style={{ animationDelay: `${(i * 30).toString()}ms` }}
          >
            <ListItem
              mediaItem={item}
              indexer={item.__typename === "Movie" ? "tmdb" : "tvdb"}
              isSelectable
              // selectStore={itemsStore}
              className="aspect-2/3 w-full"
            />
          </div>
        ))}
      </div>

      <div className="flex justify-center pt-12 pb-24">
        <LibraryPagination />
      </div>
    </>
  );
}
