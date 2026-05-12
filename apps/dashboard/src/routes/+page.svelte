<script lang="ts">
  import { Badge } from "$lib/components/ui/badge";
  import * as Card from "$lib/components/ui/card";
  import { Skeleton } from "$lib/components/ui/skeleton";
  import * as Table from "$lib/components/ui/table";
  import {
    AlertTriangle,
    Clapperboard,
    Film,
    ListChecks,
    Tv,
  } from "lucide-svelte";

  import type { OverviewData, OverviewRecentItem } from "./+page.js";

  let { data }: { data: OverviewData } = $props();

  const stats = $derived([
    {
      label: "Total Movies",
      value: data.counts.movieCount,
      icon: Film,
      hint: null as string | null,
    },
    {
      label: "Total Shows",
      value: data.counts.showCount,
      icon: Tv,
      hint: null,
    },
    {
      label: "Total Episodes",
      value: data.counts.episodeCount,
      icon: Clapperboard,
      hint: null,
    },
    {
      label: "Queue Depth",
      value: null,
      icon: ListChecks,
      hint: "Agent E owns this query",
    },
  ]);

  function fmtCount(n: number | null): string {
    if (n === null || n === undefined) return "—";
    return new Intl.NumberFormat().format(n);
  }

  function fmtDate(iso?: string | null): string {
    if (!iso) return "—";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleString();
  }

  function typeLabel(item: OverviewRecentItem): string {
    return item.__typename ?? item.type ?? "Item";
  }
</script>

<svelte:head>
  <title>Overview · Riven Dashboard</title>
</svelte:head>

<section class="space-y-6 p-8">
  <header>
    <h1 class="text-3xl font-semibold tracking-tight">Overview</h1>
    <p class="text-muted-foreground mt-1">
      Library counts and the most recent activity across riven-ts.
    </p>
  </header>

  {#if data.error}
    <Card.Root class="border-destructive/40 bg-destructive/5">
      <Card.Header class="flex flex-row items-center gap-2 space-y-0">
        <AlertTriangle class="text-destructive size-5" />
        <Card.Title class="text-destructive text-base"
          >Some overview data failed to load</Card.Title
        >
      </Card.Header>
      <Card.Content>
        <p class="text-muted-foreground text-sm">{data.error}</p>
      </Card.Content>
    </Card.Root>
  {/if}

  <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
    {#each stats as stat (stat.label)}
      {@const Icon = stat.icon}
      <Card.Root>
        <Card.Header class="flex flex-row items-center justify-between pb-2">
          <Card.Title class="text-muted-foreground text-sm font-medium">
            {stat.label}
          </Card.Title>
          <Icon class="text-muted-foreground size-4" />
        </Card.Header>
        <Card.Content>
          <div class="text-2xl font-semibold">{fmtCount(stat.value)}</div>
          {#if stat.hint}
            <p class="text-muted-foreground mt-1 text-xs">{stat.hint}</p>
          {/if}
        </Card.Content>
      </Card.Root>
    {/each}
  </div>

  <Card.Root>
    <Card.Header>
      <Card.Title>Recently added</Card.Title>
      <Card.Description>Last 10 items indexed by riven.</Card.Description>
    </Card.Header>
    <Card.Content>
      {#if data.recent.length === 0}
        <div class="text-muted-foreground py-6 text-center text-sm">
          No recent items yet — once riven indexes content it will appear here.
        </div>
      {:else}
        <Table.Root>
          <Table.Header>
            <Table.Row>
              <Table.Head>Title</Table.Head>
              <Table.Head>Type</Table.Head>
              <Table.Head>Year</Table.Head>
              <Table.Head>State</Table.Head>
              <Table.Head class="text-right">Added</Table.Head>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {#each data.recent as item (item.id)}
              <Table.Row>
                <Table.Cell class="font-medium">
                  <a
                    class="hover:underline"
                    href={`/library/${item.id}`}
                  >
                    {item.title}
                  </a>
                </Table.Cell>
                <Table.Cell>
                  <Badge variant="secondary">{typeLabel(item)}</Badge>
                </Table.Cell>
                <Table.Cell>{item.year ?? "—"}</Table.Cell>
                <Table.Cell class="text-muted-foreground"
                  >{item.state ?? "—"}</Table.Cell
                >
                <Table.Cell class="text-muted-foreground text-right text-sm">
                  {fmtDate(item.createdAt)}
                </Table.Cell>
              </Table.Row>
            {/each}
          </Table.Body>
        </Table.Root>
      {/if}
    </Card.Content>
  </Card.Root>
</section>

{#snippet skeletonRow()}
  <Skeleton class="h-10 w-full" />
{/snippet}
