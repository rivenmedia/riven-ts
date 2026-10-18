"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useHookFormAction } from "@next-safe-action/adapter-react-hook-form/hooks";
import { cn } from "cn";
import { Book, ListChecks, Loader2, Search, Trash } from "lucide-react";
import Link from "next/link";
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
import { LibraryMessage } from "./_components/library-message";
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
        disabled: totalItems === 0,
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
