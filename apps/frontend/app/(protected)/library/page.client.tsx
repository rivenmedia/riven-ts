import { fly } from "@/components/_animations/fly";
import { Button } from "@/components/_ui/button";
import { Input } from "@/components/_ui/input";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/_ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/_ui/select";
import { ImmersiveBackground } from "@/components/immersive-background/immersive-background";
import { ListItem } from "@/components/list-item/list-item";
import { PageShell } from "@/components/page-shell/page-shell";
import { CardSelectionProvider } from "@/components/providers/card-selection-provider";
import { MediaItemState } from "@repo/util-plugin-sdk/dto/enums/media-item-state.enum";

import { cn } from "cn";
import { startCase } from "es-toolkit";
import { ListChecks, Loader2, Search, Trash } from "lucide-react";
import Link from "next/link";
import { FormProvider, useForm } from "react-hook-form";
import { toast } from "sonner";

import type { MediaItem } from "@/app/_types/__generated__/graphql";

interface LibraryPageProps {
  items: MediaItem[];
  totalItems: number;
}

export function LibraryPage({ items, totalItems }: LibraryPageProps) {
  const form = useForm({
    defaultValues: {
      search: "",
      type: "all",
      state: "all",
    },
  });

  const { register } = form;

  return (
    <>
      <ImmersiveBackground />
      <PageShell className="relative z-10 flex min-h-screen flex-col overflow-x-hidden bg-transparent">
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
                <span className="h-px w-8 bg-zinc-800" />
                <span className="text-primary font-mono text-sm">
                  {totalItems.toLocaleString()} items
                </span>
              </div>
            </div>

            <FormProvider {...form}>
              <form
                method="GET"
                className="flex flex-wrap items-center gap-2 rounded-2xl border border-white/5 bg-zinc-900/40 p-2 shadow-2xl backdrop-blur-md md:gap-3"
              >
                <div className="group relative flex grow">
                  <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-zinc-500 transition-colors group-focus-within:text-white" />
                  <Input
                    {...register("search")}
                    placeholder="Search..."
                    className="h-10 rounded-xl border-transparent bg-transparent pl-9 transition-all placeholder:text-zinc-600 hover:bg-white/5 focus:bg-white/10"
                  />
                </div>
                <div className="mx-1 hidden h-6 w-px bg-white/10 md:block" />
                <div className="flex shrink gap-2">
                  <Select {...register("type")} defaultValue="all">
                    <SelectTrigger className="w-30 space-y-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All types</SelectItem>
                      <SelectItem value="movies">Movies</SelectItem>
                      <SelectItem value="tv">TV Shows</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select {...register("state")} defaultValue="all">
                    <SelectTrigger className="w-45 space-y-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All states</SelectItem>
                      {MediaItemState.options.map((state) => (
                        <SelectItem key={state} value={state}>
                          {startCase(state)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </form>
            </FormProvider>
          </header>
          {items.length > 0 ? (
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
                  {items.map((item, i) => (
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
                type="button"
              >
                <Link href="/library">Clear all filters</Link>
              </Button>
            </div>
          )}
        </div>
      </PageShell>
    </>
  );
}
