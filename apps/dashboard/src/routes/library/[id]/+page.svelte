<script lang="ts">
  import { Badge } from "$lib/components/ui/badge";
  import { Button } from "$lib/components/ui/button";
  import * as Card from "$lib/components/ui/card";
  import { ScrollArea } from "$lib/components/ui/scroll-area";
  import { Separator } from "$lib/components/ui/separator";
  import * as Table from "$lib/components/ui/table";
  import {
    AlertTriangle,
    ArrowLeft,
    Calendar,
    Database,
    ExternalLink,
    Film,
    Hash,
    HardDrive,
    Languages,
    Star,
  } from "lucide-svelte";

  import type { DetailPageData, MediaItemDetail } from "./+page.js";

  let { data }: { data: DetailPageData } = $props();

  const item = $derived(data.item);

  function fmtBytes(bytes?: number | null): string {
    if (bytes === null || bytes === undefined) return "—";
    const units = ["B", "KB", "MB", "GB", "TB"];
    let v = bytes;
    let u = 0;
    while (v >= 1024 && u < units.length - 1) {
      v /= 1024;
      u++;
    }
    return `${v.toFixed(u === 0 ? 0 : 2)} ${units[u]}`;
  }

  function fmtDate(iso?: string | null): string {
    if (!iso) return "—";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleString();
  }

  function typeLabel(it: MediaItemDetail): string {
    return it.__typename ?? it.type ?? "Item";
  }

  function imdbUrl(id?: string | null): string | null {
    if (!id) return null;
    return `https://www.imdb.com/title/${id}/`;
  }

  function initials(title: string): string {
    return title
      .split(/\s+/)
      .slice(0, 2)
      .map((s) => s[0]?.toUpperCase() ?? "")
      .join("");
  }
</script>

<svelte:head>
  <title>{item?.title ?? "Item"} · Library</title>
</svelte:head>

<section class="space-y-6 p-8">
  <div>
    <Button href="/library" variant="ghost" size="sm">
      <ArrowLeft class="mr-2 size-4" /> Back to library
    </Button>
  </div>

  {#if data.error}
    <Card.Root class="border-destructive/40 bg-destructive/5">
      <Card.Header class="flex flex-row items-center gap-2 space-y-0">
        <AlertTriangle class="text-destructive size-5" />
        <Card.Title class="text-destructive text-base">
          Failed to load item
        </Card.Title>
      </Card.Header>
      <Card.Content>
        <p class="text-muted-foreground text-sm">{data.error}</p>
      </Card.Content>
    </Card.Root>
  {:else if !item}
    <Card.Root>
      <Card.Header>
        <Card.Title>Not found</Card.Title>
        <Card.Description>
          The requested item does not exist or was removed.
        </Card.Description>
      </Card.Header>
    </Card.Root>
  {:else}
    <!-- Hero -->
    <div class="grid gap-6 md:grid-cols-[200px_1fr]">
      <div>
        {#if item.posterPath}
          <img
            src={item.posterPath}
            alt={item.title}
            class="bg-muted aspect-[2/3] w-full rounded-lg object-cover shadow"
          />
        {:else}
          <div
            class="bg-muted text-muted-foreground flex aspect-[2/3] w-full items-center justify-center rounded-lg text-4xl font-semibold"
          >
            {initials(item.title)}
          </div>
        {/if}
      </div>

      <div class="space-y-4">
        <div class="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{typeLabel(item)}</Badge>
          {#if item.state}<Badge variant="outline">{item.state}</Badge>{/if}
          {#if item.year}
            <span class="text-muted-foreground text-sm">{item.year}</span>
          {/if}
        </div>

        <h1 class="text-3xl font-semibold tracking-tight">
          {item.fullTitle ?? item.title}
        </h1>

        {#if item.genres && item.genres.length > 0}
          <div class="flex flex-wrap gap-1.5">
            {#each item.genres as genre (genre)}
              <Badge variant="outline">{genre}</Badge>
            {/each}
          </div>
        {/if}

        <dl class="text-muted-foreground grid grid-cols-2 gap-x-6 gap-y-2 text-sm md:grid-cols-3">
          {#if item.imdbId}
            <div class="flex items-center gap-2">
              <ExternalLink class="size-4" />
              <a
                href={imdbUrl(item.imdbId) ?? "#"}
                target="_blank"
                rel="noopener"
                class="text-foreground hover:underline"
              >
                {item.imdbId}
              </a>
            </div>
          {/if}
          {#if item.rating !== null && item.rating !== undefined}
            <div class="flex items-center gap-2">
              <Star class="size-4" />
              <span class="text-foreground">{item.rating.toFixed(1)}</span>
            </div>
          {/if}
          {#if item.language}
            <div class="flex items-center gap-2">
              <Languages class="size-4" />
              <span class="text-foreground">{item.language}</span>
            </div>
          {/if}
          {#if item.network}
            <div class="flex items-center gap-2">
              <Film class="size-4" />
              <span class="text-foreground">{item.network}</span>
            </div>
          {/if}
          {#if item.releaseDate}
            <div class="flex items-center gap-2">
              <Calendar class="size-4" />
              <span class="text-foreground">{fmtDate(item.releaseDate)}</span>
            </div>
          {/if}
          {#if item.scrapedTimes !== null && item.scrapedTimes !== undefined}
            <div class="flex items-center gap-2">
              <Hash class="size-4" />
              <span class="text-foreground"
                >Scraped {item.scrapedTimes}×</span
              >
            </div>
          {/if}
        </dl>
      </div>
    </div>

    <Separator />

    <!-- Seasons (Show only) -->
    {#if item.seasons && item.seasons.length > 0}
      <Card.Root>
        <Card.Header>
          <Card.Title>Seasons</Card.Title>
          <Card.Description
            >{item.seasons.length} season{item.seasons.length === 1 ? "" : "s"}</Card.Description
          >
        </Card.Header>
        <Card.Content>
          <ScrollArea class="max-h-72">
            <ul class="space-y-2 pr-3">
              {#each item.seasons as season (season.id)}
                <li class="border-border/60 flex items-center justify-between rounded border px-3 py-2">
                  <span class="text-sm font-medium">
                    Season {season.number ?? "?"}
                  </span>
                  <span class="text-muted-foreground text-xs">
                    {season.episodes?.length ?? 0} episodes
                  </span>
                </li>
              {/each}
            </ul>
          </ScrollArea>
        </Card.Content>
      </Card.Root>
    {/if}

    <!-- Filesystem entries -->
    <Card.Root>
      <Card.Header>
        <Card.Title class="flex items-center gap-2">
          <HardDrive class="size-5" /> Filesystem entries
        </Card.Title>
        <Card.Description>
          File locations and sizes tracked by riven.
        </Card.Description>
      </Card.Header>
      <Card.Content class="p-0">
        {#if !item.filesystemEntries || item.filesystemEntries.length === 0}
          <div class="text-muted-foreground py-8 text-center text-sm">
            No filesystem entries yet.
          </div>
        {:else}
          <Table.Root>
            <Table.Header>
              <Table.Row>
                <Table.Head>Path</Table.Head>
                <Table.Head>Quality</Table.Head>
                <Table.Head class="text-right">Size</Table.Head>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {#each item.filesystemEntries as entry (entry.id)}
                <Table.Row>
                  <Table.Cell class="font-mono text-xs">
                    {entry.path ?? "—"}
                  </Table.Cell>
                  <Table.Cell>
                    {#if entry.quality}
                      <Badge variant="outline">{entry.quality}</Badge>
                    {:else}
                      —
                    {/if}
                  </Table.Cell>
                  <Table.Cell class="text-muted-foreground text-right">
                    {fmtBytes(entry.size)}
                  </Table.Cell>
                </Table.Row>
              {/each}
            </Table.Body>
          </Table.Root>
        {/if}
      </Card.Content>
    </Card.Root>

    <!-- Streams / torrents -->
    {#if item.streams && item.streams.length > 0}
      <Card.Root>
        <Card.Header>
          <Card.Title class="flex items-center gap-2">
            <Database class="size-5" /> Streams
          </Card.Title>
          <Card.Description>
            Torrents / debrid links available for this item.
          </Card.Description>
        </Card.Header>
        <Card.Content class="p-0">
          <Table.Root>
            <Table.Header>
              <Table.Row>
                <Table.Head>Title</Table.Head>
                <Table.Head>Info hash</Table.Head>
                <Table.Head class="text-right">Size</Table.Head>
                <Table.Head class="text-right">S / L</Table.Head>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {#each item.streams as stream (stream.id)}
                <Table.Row>
                  <Table.Cell class="max-w-md truncate text-sm">
                    {stream.title ?? "—"}
                  </Table.Cell>
                  <Table.Cell class="text-muted-foreground font-mono text-xs">
                    {stream.infoHash?.slice(0, 12) ?? "—"}
                  </Table.Cell>
                  <Table.Cell class="text-muted-foreground text-right">
                    {fmtBytes(stream.size)}
                  </Table.Cell>
                  <Table.Cell class="text-muted-foreground text-right text-xs">
                    {stream.seeders ?? "—"} / {stream.leechers ?? "—"}
                  </Table.Cell>
                </Table.Row>
              {/each}
            </Table.Body>
          </Table.Root>
        </Card.Content>
      </Card.Root>
    {/if}

    <!-- Timestamps -->
    <Card.Root>
      <Card.Header>
        <Card.Title>Timeline</Card.Title>
      </Card.Header>
      <Card.Content>
        <dl class="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt class="text-muted-foreground">Indexed</dt>
            <dd>{fmtDate(item.indexedAt)}</dd>
          </div>
          <div>
            <dt class="text-muted-foreground">Last scraped</dt>
            <dd>{fmtDate(item.scrapedAt)}</dd>
          </div>
          <div>
            <dt class="text-muted-foreground">Created</dt>
            <dd>{fmtDate(item.createdAt)}</dd>
          </div>
          <div>
            <dt class="text-muted-foreground">Updated</dt>
            <dd>{fmtDate(item.updatedAt)}</dd>
          </div>
        </dl>
      </Card.Content>
    </Card.Root>
  {/if}
</section>
