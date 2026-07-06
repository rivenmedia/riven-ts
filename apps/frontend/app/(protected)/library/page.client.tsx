import { useState } from "react";

import { ItemActions } from "./_components/item-actions";
import { ItemsList } from "./_components/items-list";
import { NoItemsFound } from "./_components/no-items-found";
import { PageHeader } from "./_components/page-header";

import type { GetLibraryItemsQuery } from "./_queries/get-library-items.query.typegen";

export interface LibraryPageProps {
  totalItems: number;
  items: GetLibraryItemsQuery["mediaItems"];
}

export function LibraryPage({ totalItems, items }: LibraryPageProps) {
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);

  return (
    <div className="relative z-10 mx-auto flex w-full max-w-600 flex-col gap-8">
      <PageHeader totalItems={totalItems} />
      {items.length > 0 ? <ItemsList items={items} /> : <NoItemsFound />}
      {selectedItemIds.length > 0 && (
        <ItemActions selectedItemIds={selectedItemIds} />
      )}
    </div>
  );
}
