import { ListItem } from "@/components/list-item";
import { Button } from "@/components/ui/button";

import { ListChecks, Loader2, Search, Trash, X } from "lucide-react";
import Link from "next/link";
import { toast } from "react-toastify";

import { removeItems } from "./_actions/remove-items.action";
import { resetItems } from "./_actions/reset-items.action";
import { retryItems } from "./_actions/retry-items.action";
import { ActionButton } from "./_components/action-button";
import { LiveItemsPagination } from "./_components/live-items-pagination";
import { LibrarySearchForm } from "./_components/search-form";

export default async function LibraryPage() {
  const liveTotalItems = 100000;
  const liveItems = [];

  let selectedItemIds: string[] = [];

  function renderItemActions() {
    return (
      <div
        // transition:fly={{ y: 100, duration: 400, easing: cubicOut }}
        className="fixed bottom-8 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-3xl border border-white/10 bg-zinc-900/80 p-2 pl-4 shadow-2xl backdrop-blur-xl"
      >
        <div className="mr-4 flex items-center gap-3">
          <div className="bg-primary/20 text-primary flex h-8 w-8 items-center justify-center rounded-xl text-sm font-bold">
            {selectedItemIds.length}
          </div>
          <span className="text-sm font-medium text-zinc-300">Selected</span>
        </div>
        <div className="mx-1 h-8 w-px bg-white/10"></div>
        <div className="flex items-center gap-1">
          <ActionButton
            label="Reset"
            icon={ListChecks}
            action={async () => {
              try {
                const result = await resetItems({ ids: selectedItemIds });

                if (result.count > 0) {
                  toast.success(`Reset ${result.count} items`);
                } else {
                  toast.info("No matching items were reset");
                }

                itemsStore.clear();

                await refreshLiveLibrary();
              } catch (e) {
                toast.error(
                  e instanceof Error
                    ? `Error: ${e.message}`
                    : "An unknown error occurred",
                );
              }
            }}
          />

          <ActionButton
            label="Retry"
            icon={Loader2}
            action={async () => {
              try {
                const result = await retryItems({ ids: selectedItemIds });

                if (result.count > 0) {
                  toast.success(`Marked ${result.count} items for retry`);
                } else {
                  toast.info("No matching items were marked for retry");
                }

                itemsStore.clear();

                await refreshLiveLibrary();
              } catch (e) {
                toast.error(
                  e instanceof Error
                    ? `Error: ${e.message}`
                    : "An unknown error occurred",
                );
              }
            }}
          />

          <ActionButton
            label="Remove"
            icon={Trash}
            action={async () => {
              try {
                await removeItems({ ids: selectedItemIds });

                toast.success(`Removed ${selectedItemIds.length} items`);

                selectedItemIds = [];

                await refreshLiveLibrary();
              } catch (e) {
                toast.error(
                  e instanceof Error
                    ? `Error: ${e.message}`
                    : "An unknown error occurred",
                );
              }
            }}
            variant="destructive"
          />

          <div className="mx-1 h-8 w-px bg-white/10"></div>

          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-xl hover:bg-white/10"
            onClick={() => itemsStore.clear()}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  function renderLiveItems() {
    return (
      <>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 md:gap-6 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7">
          {liveItems.map((item, i) => (
            <div
              key={item.id}
              className="animate-in fade-in slide-in-from-bottom-4 fill-mode-backwards duration-700"
              style={{ animationDelay: `${(i * 30).toString()}ms` }}
            >
              <ListItem
                data={item}
                indexer={item.indexer}
                type={item.type}
                isSelectable
                selectStore={itemsStore}
                className="aspect-2/3 w-full"
              />
            </div>
          ))}
        </div>

        <div className="flex justify-center pt-12 pb-24">
          <LiveItemsPagination />
        </div>
      </>
    );
  }

  function renderNoItemsFound() {
    return (
      <div className="flex min-h-[50vh] flex-1 flex-col items-center justify-center space-y-4 text-center">
        <div className="flex h-24 w-24 items-center justify-center rounded-full border border-white/5 bg-zinc-900/50">
          <Search className="h-10 w-10 text-zinc-600" />
        </div>
        <div>
          <h3 className="text-xl font-medium text-white">No items found</h3>
          <p className="mx-auto mt-2 max-w-sm text-zinc-500">
            {
              "We couldn't find anything matching your search. Try adjusting the filters or search term."
            }
          </p>
        </div>
        <Button
          asChild
          variant="outline"
          className="border-white/10 hover:bg-white/5"
        >
          <Link href="/library">Clear all filters</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="relative z-10 mx-auto flex w-full max-w-600 flex-col gap-8">
      <header className="flex flex-col justify-between gap-6 pt-32 md:flex-row md:items-end md:pt-0">
        <div className="space-y-2">
          <h1 className="font-serif text-5xl font-medium tracking-tight text-white/90 md:text-7xl">
            Library
          </h1>
          <div className="flex items-center gap-2 text-zinc-400">
            <span className="font-mono text-xs tracking-widest uppercase">
              Index
            </span>
            <span className="h-px w-8 bg-zinc-800"></span>
            <span className="text-primary font-mono text-sm">
              {liveTotalItems.toLocaleString()} items
            </span>
          </div>
        </div>

        <LibrarySearchForm />
      </header>

      {liveTotalItems > 0 ? renderLiveItems() : renderNoItemsFound()}
      {selectedItemIds.length > 0 && renderItemActions()}
    </div>
  );
}
