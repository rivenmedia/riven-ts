"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useHookFormAction } from "@next-safe-action/adapter-react-hook-form/hooks";
import { cn } from "cn";
import { ListChecks, Loader2, Search, Trash } from "lucide-react";
import { useRef } from "react";
import { FormProvider } from "react-hook-form";
import { toast } from "sonner";

import { fly } from "#components/_animations/fly.ts";
import { Button } from "#components/_ui/button.tsx";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "#components/_ui/pagination.tsx";
import { ListItem } from "#components/list-item/list-item.tsx";
import { PageShell } from "#components/page-shell/page-shell.tsx";
import { CardSelectionProvider } from "#components/providers/card-selection-provider.tsx";

import { searchLibrary } from "./_actions/search.action";
import { LibrarySearchInputs } from "./_components/library-search-inputs";
import { LibrarySearchForm } from "./_schemas/library-search.form-schema";

import type { MediaItem } from "#app/_types/__generated__/graphql.ts";

interface LibraryPageProps {
  items: Pick<MediaItem, "id" | "posterPath" | "title" | "type" | "year">[];
  totalItems: number;
}

export function LibraryPage({ items, totalItems }: LibraryPageProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const { action, form, handleSubmitWithAction } = useHookFormAction(
    searchLibrary,
    zodResolver(LibrarySearchForm),
    {
      formProps: {
        defaultValues: {
          search: "",
          type: "all",
          state: "all",
        },
        progressive: true,
      },
    },
  );

  const lastSubmittedSearchRef = useRef(form.formState.defaultValues?.search);

  const submitForm = () => {
    lastSubmittedSearchRef.current = form.getValues("search");

    formRef.current?.requestSubmit();
  };

  const results = action.result.data?.items ?? items;

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
              <>
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
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 md:gap-6 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7">
                    {results.map((item, i) => (
                      <div
                        key={item.id}
                        className={cn("animation-duration-700", fly)}
                        style={{ animationDelay: `${(i * 30).toString()}ms` }}
                      >
                        <ListItem
                          mediaItem={item}
                          indexer=""
                          isSelectable
                          className="aspect-2/3 w-full"
                          {...(i % 2 === 0
                            ? { badge: { text: "New", variant: "success" } }
                            : {})}
                        />
                      </div>
                    ))}
                  </div>
                </CardSelectionProvider>
                <div className="flex justify-center pt-12 pb-24">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious href="#" />
                      </PaginationItem>
                      <PaginationItem>
                        <PaginationLink href="#">1</PaginationLink>
                      </PaginationItem>
                      <PaginationItem>
                        <PaginationLink href="#" isActive>
                          2
                        </PaginationLink>
                      </PaginationItem>
                      <PaginationItem>
                        <PaginationLink href="#">3</PaginationLink>
                      </PaginationItem>
                      <PaginationItem>
                        <PaginationEllipsis />
                      </PaginationItem>
                      <PaginationItem>
                        <PaginationNext href="#" />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              </>
            ) : (
              <div className="flex min-h-[50vh] flex-1 flex-col items-center justify-center space-y-4 text-center">
                <div className="flex h-24 w-24 items-center justify-center rounded-full border border-white/5 bg-zinc-900/50">
                  <Search className="h-10 w-10 text-zinc-600" />
                </div>
                <div>
                  <h3 className="text-xl font-medium text-white">
                    No items found
                  </h3>
                  <p className="mx-auto mt-2 max-w-sm text-zinc-500">
                    We couldn&apos;t find anything matching your search. Try
                    adjusting the filters or search term.
                  </p>
                </div>
                <Button
                  variant="outline"
                  className="border-white/10 hover:bg-white/5"
                  type="reset"
                >
                  Clear all filters
                </Button>
              </div>
            )}
          </form>
        </FormProvider>
      </div>
    </PageShell>
  );
}
