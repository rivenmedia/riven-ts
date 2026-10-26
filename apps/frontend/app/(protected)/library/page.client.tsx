"use client";

import { TopLevelMediaItemType } from "@repo/util-plugin-sdk/dto/enums/top-level-media-item-type.enum";

import { zodResolver } from "@hookform/resolvers/zod";
import { useHookFormAction } from "@next-safe-action/adapter-react-hook-form/hooks";
import { Book, ListChecks, Loader2, Search, Trash } from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";
import { FormProvider } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "#components/_ui/button.tsx";
import { ItemGrid } from "#components/item-grid/item-grid.tsx";
import { PageShell } from "#components/page-shell/page-shell.tsx";
import { CardSelectionProvider } from "#components/providers/card-selection-provider.tsx";
import { isFeatureEnabled } from "#lib/enabled-features.ts";

import { InfiniteItemGrid } from "../_components/infinite-item-grid/infinite-item-grid";
import { searchLibrary } from "./_actions/search.action";
import { LibraryMessage } from "./_components/library-message";
import { LibrarySearchInputs } from "./_components/library-search-inputs";
import { LibrarySearchForm } from "./_schemas/library-search.form-schema";

import type { MediaItem } from "#app/_types/__generated__/graphql.ts";
import type { LibrarySearchFormValues } from "./_schemas/library-search.form-schema";

const TopLevelMediaItem = z.looseObject({
  type: TopLevelMediaItemType,
});

function isTopLevelMediaItem(
  item: unknown,
): item is { type: TopLevelMediaItemType } {
  return TopLevelMediaItem.safeParse(item).success;
}

interface LibraryPageProps {
  items: Pick<
    MediaItem,
    "id" | "posterPath" | "title" | "type" | "year" | "primaryExternalId"
  >[];
  totalItems: number;
  endCursor: string | null;
  hasNextPage: boolean;
}

const defaultFormValues = {
  search: "",
  type: "all",
  state: "all",
} satisfies LibrarySearchFormValues;

/**
 * Library route listing the user's media items, with search, type and state
 * filters.
 */
export function LibraryPage({
  items,
  totalItems,
  endCursor,
  hasNextPage,
}: LibraryPageProps) {
  const formRef = useRef<HTMLFormElement>(null);

  // Cursor for the page after the last one loaded; reset whenever a new search completes
  const nextPageRef = useRef({ endCursor, hasNextPage });
  const [searchCount, setSearchCount] = useState(0);

  const { action, form, handleSubmitWithAction } = useHookFormAction(
    searchLibrary,
    zodResolver(LibrarySearchForm),
    {
      actionProps: {
        onSuccess({ data }) {
          nextPageRef.current = {
            endCursor: data.endCursor,
            hasNextPage: data.hasNextPage,
          };

          setSearchCount((count) => count + 1);
        },
      },
      formProps: {
        disabled: totalItems === 0,
        defaultValues: defaultFormValues,
        progressive: true,
      },
    },
  );

  const fetchNextPage = async () => {
    const nextPage = nextPageRef.current;

    if (!nextPage.hasNextPage || !nextPage.endCursor) {
      return new Map<string, never>();
    }

    // Use the last submitted filters, not any unsubmitted edits in the form
    const result = await searchLibrary({
      ...(action.isIdle ? defaultFormValues : action.input),
      after: nextPage.endCursor,
    });

    if (!result.data) {
      toast.error("Failed to load more items");

      return new Map<string, never>();
    }

    // Ignore pages that resolve after a new search has replaced the results
    if (nextPageRef.current === nextPage) {
      nextPageRef.current = {
        endCursor: result.data.endCursor,
        hasNextPage: result.data.hasNextPage,
      };
    }

    return new Map(
      result.data.items
        .filter((item) => isTopLevelMediaItem(item))
        .map((item) => [item.id, item]),
    );
  };

  const lastSubmittedSearchRef = useRef(form.formState.defaultValues?.search);

  const submitForm = () => {
    lastSubmittedSearchRef.current = form.getValues("search");

    formRef.current?.requestSubmit();
  };

  const results = (action.result.data?.items ?? items).filter((item) =>
    isTopLevelMediaItem(item),
  );

  const initialResultsMap = new Map(results.map((item) => [item.id, item]));

  return (
    <PageShell className="relative z-10 flex min-h-screen flex-col overflow-x-hidden bg-transparent">
      <div className="relative z-10 mx-auto flex w-full max-w-600 flex-col gap-8">
        <FormProvider {...form}>
          <form
            className="flex gap-8 flex-col"
            ref={formRef}
            onSubmit={(event) => {
              void handleSubmitWithAction(event);
            }}
          >
            <header className="flex flex-col justify-between gap-6 pt-32 md:flex-row md:items-end md:pt-0">
              <div className="space-y-2">
                <h1 className="font-serif text-5xl font-medium tracking-tight text-white/90 md:text-7xl">
                  Library
                </h1>
                <div className="flex items-center gap-2 text-zinc-400">
                  <span className="font-mono text-xs tracking-widest uppercase">
                    Index
                  </span>
                  <span className="h-px w-8 bg-zinc-800" />
                  <span className="text-primary font-mono text-sm">
                    {totalItems.toLocaleString()} items
                  </span>
                </div>
              </div>
              <LibrarySearchInputs
                submitForm={submitForm}
                lastSubmittedSearchRef={lastSubmittedSearchRef}
              />
            </header>
            {results.length > 0 ? (
              <CardSelectionProvider
                actions={[
                  {
                    label: "Reset",
                    icon: ListChecks,
                    handleClick: () => {
                      // actionInProgress = true;
                      // try {
                      //   const result = await reset_items({
                      //     ids: itemsStore.items.map((id) => id.toString()),
                      //   });
                      //   if (result.count > 0) {
                      //     toast.success(`Reset ${result.count} items`);
                      //   } else {
                      //     toast.info("No matching items were reset");
                      //   }
                      //   // itemsStore.clear();
                      //   // await refreshLiveLibrary();
                      // } catch (error) {
                      //   if (error instanceof Error) {
                      //     toast.error(`Error: ${error.message}`);
                      //   } else {
                      //     toast.error("An unknown error occurred");
                      //   }
                      // } finally {
                      //   actionInProgress = false;
                      // }
                    },
                  },
                  {
                    label: "Retry",
                    icon: Loader2,
                    handleClick: () => {
                      // actionInProgress = true;
                      try {
                        // const result = await retry_items({
                        // ids: itemsStore.items.map((id) => id.toString()),
                        // });
                        // if (result.count > 0) {
                        //   toast.success(
                        //     `Marked ${result.count} items for retry`,
                        //   );
                        // } else {
                        //   toast.info("No matching items were marked for retry");
                        // }
                        // itemsStore.clear();
                        // await refreshLiveLibrary();
                      } catch (error) {
                        if (error instanceof Error) {
                          toast.error(`Error: ${error.message}`);
                        } else {
                          toast.error("An unknown error occurred");
                        }
                      } finally {
                        // actionInProgress = false;
                      }
                    },
                  },
                  {
                    label: "Remove",
                    icon: Trash,
                    variant: "destructive",
                    handleClick: () => {
                      // actionInProgress = true;
                      try {
                        // await remove_items({
                        //   ids: itemsStore.items.map((id) => id.toString()),
                        // });
                        // toast.success(`Removed ${itemsStore.count} items`);
                        // itemsStore.clear();
                        // await refreshLiveLibrary();
                      } catch (error) {
                        if (error instanceof Error) {
                          toast.error(`Error: ${error.message}`);
                        } else {
                          toast.error("An unknown error occurred");
                        }
                      } finally {
                        // actionInProgress = false;
                      }
                    },
                  },
                ]}
              >
                <ItemGrid>
                  <InfiniteItemGrid
                    key={searchCount}
                    fetchPage={fetchNextPage}
                    initialData={initialResultsMap}
                    noItemsFoundMessage="Your library is empty"
                    getItemHref={(item) =>
                      `/details/media/${item.type}/${item.primaryExternalId}`
                    }
                    isSelectable={isFeatureEnabled("selectableLibraryItems")}
                    isAnimated
                  />
                </ItemGrid>
              </CardSelectionProvider>
            ) : (
              <div className="flex min-h-[50vh] flex-1 flex-col items-center justify-center space-y-4 text-center">
                {totalItems === 0 ? (
                  <LibraryMessage
                    icon={Book}
                    title="Your library is empty"
                    description={
                      "You haven't added any items to your library yet.\nStart by adding your favourite movies and shows."
                    }
                    button={
                      <Button
                        variant="outline"
                        className="border-white/10 hover:bg-white/5"
                        type="button"
                      >
                        <Link href="/explore">Add items to library</Link>
                      </Button>
                    }
                  />
                ) : (
                  <LibraryMessage
                    icon={Search}
                    title="No items found"
                    description={
                      "We couldn't find anything matching your search.\nTry adjusting the filters or search term."
                    }
                    button={
                      <Button
                        variant="outline"
                        className="border-white/10 hover:bg-white/5"
                        type="button"
                        onClick={() => {
                          // Reset the form values and re-submit
                          form.reset();
                          submitForm();
                        }}
                      >
                        Clear all filters
                      </Button>
                    }
                  />
                )}
              </div>
            )}
          </form>
        </FormProvider>
      </div>
    </PageShell>
  );
}
