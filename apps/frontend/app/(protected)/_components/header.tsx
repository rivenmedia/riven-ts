"use client";

import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Kbd } from "@/components/ui/kbd";

import { Menu, Search } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { useDebounce, useEvent, useLifecycles, useUnmount } from "react-use";

interface HeaderProps {
  modifierKey: "⌘" | "⌃" | null;
}

export function Header({ modifierKey }: HeaderProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  // Local input value state to decouple from URL updates while typing
  const inputRef = useRef<HTMLInputElement | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);

  const form = useForm({
    defaultValues: { query: searchParams.get("query") ?? "" },
  });

  const inputValue = useWatch({
    control: form.control,
    name: "query",
  });

  function onKeyDown(e: KeyboardEvent) {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();

      inputRef.current?.focus();
    }
  }

  useLifecycles(
    () => {
      document.addEventListener("keydown", onKeyDown);
    },
    () => {
      document.removeEventListener("keydown", onKeyDown);
    },
  );

  useEffect(() => {
    // Sync external URL changes to input, but avoid overwriting while typing
    const urlQuery = searchParams.get("query") ?? "";
    const inputValue = form.getValues("query");

    // Only update if the value is different and we aren't focused
    // Or if we just navigated to a completely different page/query via link
    if (
      urlQuery !== inputValue &&
      inputRef.current !== document.activeElement
    ) {
      form.setValue("query", urlQuery);
    }
  }, [searchParams, form]);

  function navigateToSearch(query: string) {
    // Read directly from local state
    const isExplorePage = pathname === "/explore";

    // Client-first search: Immediately update store if we're on the explore page
    // This avoids waiting for the server round-trip (goto -> load -> data -> effect)
    // and fixes reactivity issues when typing quickly.

    // if (isExplorePage) {
    //   const parsed = parseSearchQuery(query);
    //   searchStore.syncQuery(parsed);
    // }

    const navigationType = isExplorePage ? "replace" : "push";

    router[navigationType](`/explore?query=${encodeURIComponent(query)}`, {
      scroll: false,
    });
  }

  const onSubmit = form.handleSubmit(({ query }) => {
    navigateToSearch(query);
  });

  const [, cancelNavigateToSearch] = useDebounce(
    () => {
      if (form.getFieldState("query").isDirty) {
        void onSubmit();
      }
    },
    300,
    [inputValue],
  );

  useEvent(
    "riven:search",
    ({ detail: { query } }: CustomEvent<{ query: string }>) => {
      if (query) {
        form.setValue("query", query);

        inputRef.current?.focus();

        navigateToSearch(query);
      }
    },
  );

  useUnmount(cancelNavigateToSearch);

  return (
    <header className="pointer-events-none absolute top-0 left-0 z-50 hidden h-20 w-full items-center bg-linear-to-b from-black/50 to-transparent px-4 transition-all duration-500 md:flex md:px-16">
      <div className="pointer-events-auto flex w-full items-center justify-between gap-6">
        <form
          ref={formRef}
          className="mx-auto w-full max-w-lg transition-all duration-300 focus-within:max-w-xl"
          onSubmit={void onSubmit}
        >
          <InputGroup className="h-11 w-full rounded-full border border-white/5 bg-white/5 shadow-lg backdrop-blur-xl transition-all duration-300 focus-within:border-white/10 focus-within:bg-black/40 focus-within:ring-1 focus-within:ring-white/20 hover:bg-white/10">
            <InputGroupAddon align="inline-start" className="pl-4">
              <Search className="size-4 text-white/50" />
            </InputGroupAddon>
            <Controller
              name="query"
              control={form.control}
              render={({ field }) => (
                <InputGroupInput
                  {...field}
                  ref={(el) => {
                    field.ref(el);
                    inputRef.current = el;
                  }}
                  placeholder="Search movies, shows, people..."
                  aria-label="Search"
                  className="text-sm font-medium placeholder:text-white/40"
                  autoComplete="off"
                />
              )}
            />
            {modifierKey && (
              <InputGroupAddon align="inline-end" className="pr-4">
                <Kbd className="h-5 min-h-0 border-white/10 bg-white/5 px-1.5 text-[10px] text-white/50">
                  {modifierKey} K
                </Kbd>
              </InputGroupAddon>
            )}
          </InputGroup>
        </form>

        <div className="flex items-center gap-2">
          <div className="md:hidden">
            {/* <NotificationCenter className="bg-background/60 rounded-xl backdrop-blur-md" /> */}
          </div>

          <Button
            variant="ghost"
            className="bg-background/60 size-10 rounded-xl backdrop-blur-md md:hidden"
            // onClick={() => SidebarStore.toggle()}
          >
            <Menu className="size-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
