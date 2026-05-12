<script lang="ts">
  import { goto } from "$app/navigation";
  import { page } from "$app/state";
  import { Badge } from "$lib/components/ui/badge";
  import { Button } from "$lib/components/ui/button";
  import * as Card from "$lib/components/ui/card";
  import { Skeleton } from "$lib/components/ui/skeleton";
  import * as Table from "$lib/components/ui/table";
  import { client, gql } from "$lib/graphql";
  import {
    AlertTriangle,
    ChevronLeft,
    ChevronRight,
    Search,
  } from "lucide-svelte";

  import type {
    LibraryItem,
    LibraryPageData,
  } from "./+page.js";
  import { _PAGE_SIZE } from "./+page.js";

  const LIBRARY_ITEMS = gql`
    query LibraryItems(
      $limit: Int = 50
      $offset: Int = 0
      $search: String
      $type: String
    ) {
      mediaItems(
        limit: $limit
        offset: $offset
        search: $search
        type: $type
      ) {
        __typename
        id
        title
        year
        type
        state
        posterPath
        updatedAt
        createdAt
      }
    }
  `;

  let { data }: { data: LibraryPageData } = $props();

  let items = $state<LibraryItem[]>(data.items);
  let currentPage = $state(data.page);
  let hasMore = $state(data.hasMore);
  let searchValue = $state(data.search);
  let isLoading = $state(false);
  let error = $state<string | null>(data.error);

  // Reconcile when server-side load re-runs (e.g. back/forward nav).
  $effect(() => {
    items = data.items;
    currentPage = data.page;
    hasMore = data.hasMore;
    error = data.error;
  });

  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  function onSearchInput(value: string) {
    searchValue = value;
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      const next = new URL(page.url);
      if (value.trim().length === 0) next.searchParams.delete("q");
      else next.searchParams.set("q", value.trim());
      next.searchParams.delete("page");
      goto(next.pathname + next.search, { keepFocus: true, replaceState: true });
    }, 300);
  }

  async function loadPage(target: number) {
    if (target < 1) return;
    isLoading = true;
    error = null;
    try {
      const offset = (target - 1) * _PAGE_SIZE;
      const { data: result } = await client.query<{ mediaItems: LibraryItem[] }>({
        query: LIBRARY_ITEMS,
        variables: {
          limit: _PAGE_SIZE,
          offset,
          search: searchValue.trim().length > 0 ? searchValue.trim() : null,
        },
        fetchPolicy: "network-only",
      });
      const next = result?.mediaItems ?? [];
      items = next;
      currentPage = target;
      hasMore = next.length === _PAGE_SIZE;

      const url = new URL(page.url);
      if (target === 1) url.searchParams.delete("page");
      else url.searchParams.set("page", String(target));
      goto(url.pathname + url.search, { keepFocus: true, replaceState: true, noScroll: true });
    } catch (err) {
      error = err instanceof Error ? err.message : String(err);
    } finally {
      isLoading = false;
    }
  }

  function initials(title: string): string {
    return title
      .split(/\s+/)
      .slice(0, 2)
      .map((s) => s[0]?.toUpperCase() ?? "")
      .join("");
  }

  function typeLabel(item: LibraryItem): string {
    return item.__typename ?? item.type ?? "Item";
  }

  function fmtDate(iso?: string | null): string {
    if (!iso) return "—";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleDateString();
  }
</script>

<svelte:head>
  <title>Library · Riven Dashboard</title>
</svelte:head>

<section class="space-y-6 p-8">
  <header class="flex flex-col gap-2">
    <h1 class="text-3xl font-semibold tracking-tight">Library</h1>
    <p class="text-muted-foreground">
      Browse every movie, show, and episode tracked by riven.
    </p>
  </header>

  <div class="flex items-center gap-3">
    <div class="relative w-full max-w-sm">
      <Search
        class="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
      />
      <input
        type="search"
        placeholder="Search titles..."
        class="border-input bg-background ring-offset-background focus-visible:ring-ring h-10 w-full rounded-md border py-2 pr-3 pl-9 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
        value={searchValue}
        oninput={(e) => onSearchInput((e.target as HTMLInputElement).value)}
      />
    </div>
    {#if isLoading}
      <span class="text-muted-foreground text-xs">Loading…</span>
    {/if}
  </div>

  {#if error}
    <Card.Root class="border-destructive/40 bg-destructive/5">
      <Card.Header class="flex flex-row items-center gap-2 space-y-0">
        <AlertTriangle class="text-destructive size-5" />
        <Card.Title class="text-destructive text-base">
          Failed to load library
        </Card.Title>
      </Card.Header>
      <Card.Content>
        <p class="text-muted-foreground text-sm">{error}</p>
      </Card.Content>
    </Card.Root>
  {/if}

  <Card.Root>
    <Card.Content class="p-0">
      {#if isLoading && items.length === 0}
        <div class="space-y-2 p-4">
          {#each Array(8) as _, i (i)}
            <Skeleton class="h-12 w-full" />
          {/each}
        </div>
      {:else if items.length === 0}
        <div class="text-muted-foreground py-16 text-center text-sm">
          {searchValue.trim().length > 0
            ? `No results for "${searchValue.trim()}"`
            : "No items in the library yet."}
        </div>
      {:else}
        <Table.Root>
          <Table.Header>
            <Table.Row>
              <Table.Head class="w-16"></Table.Head>
              <Table.Head>Title</Table.Head>
              <Table.Head>Year</Table.Head>
              <Table.Head>Type</Table.Head>
              <Table.Head>State</Table.Head>
              <Table.Head class="text-right">Updated</Table.Head>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {#each items as item (item.id)}
              <Table.Row class="cursor-pointer">
                <Table.Cell>
                  <a href={`/library/${item.id}`} class="block">
                    {#if item.posterPath}
                      <img
                        src={item.posterPath}
                        alt=""
                        loading="lazy"
                        class="bg-muted size-10 rounded object-cover"
                      />
                    {:else}
                      <div
                        class="bg-muted text-muted-foreground flex size-10 items-center justify-center rounded text-xs font-medium"
                      >
                        {initials(item.title)}
                      </div>
                    {/if}
                  </a>
                </Table.Cell>
                <Table.Cell class="font-medium">
                  <a class="hover:underline" href={`/library/${item.id}`}>
                    {item.title}
                  </a>
                </Table.Cell>
                <Table.Cell class="text-muted-foreground">
                  {item.year ?? "—"}
                </Table.Cell>
                <Table.Cell>
                  <Badge variant="secondary">{typeLabel(item)}</Badge>
                </Table.Cell>
                <Table.Cell class="text-muted-foreground">
                  {item.state ?? "—"}
                </Table.Cell>
                <Table.Cell class="text-muted-foreground text-right text-sm">
                  {fmtDate(item.updatedAt ?? item.createdAt)}
                </Table.Cell>
              </Table.Row>
            {/each}
          </Table.Body>
        </Table.Root>
      {/if}
    </Card.Content>
  </Card.Root>

  <div class="flex items-center justify-between">
    <p class="text-muted-foreground text-sm">
      Page {currentPage} · {items.length} item{items.length === 1 ? "" : "s"}
    </p>
    <div class="flex gap-2">
      <Button
        variant="outline"
        size="sm"
        disabled={currentPage <= 1 || isLoading}
        onclick={() => loadPage(currentPage - 1)}
      >
        <ChevronLeft class="mr-1 size-4" /> Previous
      </Button>
      <Button
        variant="outline"
        size="sm"
        disabled={!hasMore || isLoading}
        onclick={() => loadPage(currentPage + 1)}
      >
        Next <ChevronRight class="ml-1 size-4" />
      </Button>
    </div>
  </div>
</section>
