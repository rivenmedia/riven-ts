<script lang="ts">
  import { goto, invalidateAll } from "$app/navigation";
  import { page } from "$app/state";
  import { client, gql } from "$lib/graphql";
  import { Badge } from "$lib/components/ui/badge";
  import { Button } from "$lib/components/ui/button";
  import * as Card from "$lib/components/ui/card";
  import { ScrollArea } from "$lib/components/ui/scroll-area";
  import { Skeleton } from "$lib/components/ui/skeleton";
  import * as Table from "$lib/components/ui/table";
  import {
    AlertTriangle,
    CheckCircle2,
    Clock,
    Loader2,
    PauseCircle,
    RefreshCw,
    Trash2,
    XCircle,
  } from "lucide-svelte";
  import type {
    JobStatus,
    QueueCounts,
    QueueJob,
    QueueOverview,
    QueueJobsPage,
  } from "./+page";

  const { data } = $props<{
    data: {
      queues: QueueOverview[];
      jobs: QueueJobsPage | null;
      selectedQueue: string | null;
      selectedStatus: JobStatus;
      resolverMissing: boolean;
      errorMessage: string | null;
    };
  }>();

  const STATUSES: readonly JobStatus[] = [
    "waiting",
    "active",
    "completed",
    "failed",
  ];

  const RETRY_JOB = gql`
    mutation RetryJob($queue: String!, $id: String!) {
      retryJob(queue: $queue, id: $id)
    }
  `;
  const REMOVE_JOB = gql`
    mutation RemoveJob($queue: String!, $id: String!) {
      removeJob(queue: $queue, id: $id)
    }
  `;
  const QUEUES_OVERVIEW_POLL = gql`
    query QueuesOverview {
      queues {
        name
        counts {
          waiting
          active
          completed
          failed
          delayed
          paused
        }
      }
    }
  `;

  let liveQueues = $state<QueueOverview[]>(data.queues);
  let actionPending = $state<string | null>(null);
  let actionError = $state<string | null>(null);

  $effect(() => {
    liveQueues = data.queues;
  });

  // Poll counts every 5s. No-op if resolver is missing.
  $effect(() => {
    if (data.resolverMissing) return;
    const id = setInterval(async () => {
      try {
        const res = await client.query<{ queues: QueueOverview[] }>({
          query: QUEUES_OVERVIEW_POLL,
          fetchPolicy: "network-only",
        });
        if (res.data?.queues) liveQueues = res.data.queues;
      } catch {
        // swallow — surfaced on next nav
      }
    }, 5000);
    return () => clearInterval(id);
  });

  function navigateTo(queue: string | null, status: JobStatus) {
    const params = new URLSearchParams(page.url.searchParams);
    if (queue) params.set("queue", queue);
    else params.delete("queue");
    params.set("status", status);
    goto(`/queue?${params.toString()}`, {
      keepFocus: true,
      noScroll: true,
      invalidateAll: true,
    });
  }

  async function retryJob(job: QueueJob) {
    if (!data.selectedQueue) return;
    actionPending = job.id;
    actionError = null;
    try {
      await client.mutate({
        mutation: RETRY_JOB,
        variables: { queue: data.selectedQueue, id: job.id },
      });
      await invalidateAll();
    } catch (err) {
      actionError = err instanceof Error ? err.message : String(err);
    } finally {
      actionPending = null;
    }
  }

  async function removeJob(job: QueueJob) {
    if (!data.selectedQueue) return;
    actionPending = job.id;
    actionError = null;
    try {
      await client.mutate({
        mutation: REMOVE_JOB,
        variables: { queue: data.selectedQueue, id: job.id },
      });
      await invalidateAll();
    } catch (err) {
      actionError = err instanceof Error ? err.message : String(err);
    } finally {
      actionPending = null;
    }
  }

  function formatTime(ts: number | null | undefined): string {
    if (!ts) return "—";
    try {
      return new Date(ts).toLocaleString();
    } catch {
      return String(ts);
    }
  }

  function bestTimestamp(job: QueueJob): number {
    return job.finishedOn ?? job.processedOn ?? job.timestamp;
  }

  function statusIcon(status: JobStatus) {
    switch (status) {
      case "waiting":
        return Clock;
      case "active":
        return Loader2;
      case "completed":
        return CheckCircle2;
      case "failed":
        return XCircle;
    }
  }

  function totalFor(counts: QueueCounts): number {
    return (
      counts.waiting +
      counts.active +
      counts.completed +
      counts.failed +
      counts.delayed +
      counts.paused
    );
  }
</script>

<div class="space-y-6 p-6">
  <header class="flex items-center justify-between">
    <div>
      <h1 class="text-2xl font-semibold tracking-tight">Queues</h1>
      <p class="text-sm text-muted-foreground">
        BullMQ job throughput across riven workers. Counts refresh every 5
        seconds.
      </p>
    </div>
  </header>

  {#if data.resolverMissing}
    <Card.Root>
      <Card.Header>
        <Card.Title class="flex items-center gap-2">
          <AlertTriangle class="size-5 text-amber-500" />
          Resolvers pending
        </Card.Title>
        <Card.Description>
          Brandon's dispatch noted this would be the case — the riven-ts
          GraphQL surface doesn't expose queue resolvers yet. The dashboard
          queries are written and ready to wire up.
        </Card.Description>
      </Card.Header>
      <Card.Content>
        <details class="text-sm text-muted-foreground">
          <summary class="cursor-pointer select-none">Server error detail</summary>
          <pre
            class="mt-2 max-h-48 overflow-auto rounded-md bg-muted p-3 text-xs">{data.errorMessage}</pre>
        </details>
        <p class="mt-4 text-sm text-muted-foreground">
          Expected operations: <code>queues</code>, <code>jobs(queue, status, limit, offset)</code>,
          <code>retryJob(queue, id)</code>, <code>removeJob(queue, id)</code>.
        </p>
      </Card.Content>
    </Card.Root>
  {:else if data.errorMessage}
    <Card.Root>
      <Card.Header>
        <Card.Title class="flex items-center gap-2">
          <XCircle class="size-5 text-destructive" />
          Couldn't load queues
        </Card.Title>
        <Card.Description>{data.errorMessage}</Card.Description>
      </Card.Header>
    </Card.Root>
  {:else if liveQueues.length === 0}
    <Card.Root>
      <Card.Header>
        <Card.Title>No queues registered</Card.Title>
        <Card.Description>
          Once a worker registers a BullMQ queue it will appear here.
        </Card.Description>
      </Card.Header>
    </Card.Root>
  {:else}
    <section class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {#each liveQueues as q (q.name)}
        {@const total = totalFor(q.counts)}
        {@const isSelected = q.name === data.selectedQueue}
        <Card.Root
          class={isSelected ? "ring-2 ring-primary" : ""}
        >
          <Card.Header>
            <div class="flex items-start justify-between gap-2">
              <Card.Title class="truncate text-base">{q.name}</Card.Title>
              <Badge variant="secondary">{total}</Badge>
            </div>
          </Card.Header>
          <Card.Content class="space-y-2 text-sm">
            <div class="flex items-center justify-between">
              <span class="flex items-center gap-1.5 text-muted-foreground">
                <Clock class="size-3.5" /> waiting
              </span>
              <span class="font-mono">{q.counts.waiting}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="flex items-center gap-1.5 text-muted-foreground">
                <Loader2 class="size-3.5" /> active
              </span>
              <span class="font-mono">{q.counts.active}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="flex items-center gap-1.5 text-muted-foreground">
                <CheckCircle2 class="size-3.5" /> completed
              </span>
              <span class="font-mono">{q.counts.completed}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="flex items-center gap-1.5 text-destructive">
                <XCircle class="size-3.5" /> failed
              </span>
              <span class="font-mono">{q.counts.failed}</span>
            </div>
            <div class="flex items-center justify-between text-xs text-muted-foreground">
              <span class="flex items-center gap-1.5">
                <PauseCircle class="size-3.5" /> paused
              </span>
              <span class="font-mono">{q.counts.paused}</span>
            </div>
            <div class="flex items-center justify-between text-xs text-muted-foreground">
              <span>delayed</span>
              <span class="font-mono">{q.counts.delayed}</span>
            </div>
          </Card.Content>
          <Card.Footer>
            <Button
              variant={isSelected ? "default" : "outline"}
              size="sm"
              class="w-full"
              onclick={() => navigateTo(q.name, data.selectedStatus)}
            >
              {isSelected ? "Selected" : "Inspect jobs"}
            </Button>
          </Card.Footer>
        </Card.Root>
      {/each}
    </section>

    {#if data.selectedQueue}
      <section class="space-y-3">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-medium">
            Jobs in <span class="font-mono">{data.selectedQueue}</span>
          </h2>
          <div class="flex gap-1">
            {#each STATUSES as s (s)}
              {@const Icon = statusIcon(s)}
              <Button
                variant={s === data.selectedStatus ? "default" : "outline"}
                size="sm"
                onclick={() => navigateTo(data.selectedQueue, s)}
              >
                <Icon class="mr-1.5 size-3.5" />
                {s}
              </Button>
            {/each}
          </div>
        </div>

        {#if actionError}
          <div
            class="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
          >
            {actionError}
          </div>
        {/if}

        <Card.Root>
          {#if data.jobs === null}
            <Card.Content class="p-6">
              <div class="space-y-2">
                <Skeleton class="h-6 w-full" />
                <Skeleton class="h-6 w-full" />
                <Skeleton class="h-6 w-3/4" />
              </div>
            </Card.Content>
          {:else if data.jobs.edges.length === 0}
            <Card.Content class="p-8 text-center text-sm text-muted-foreground">
              No <span class="font-mono">{data.selectedStatus}</span> jobs in this
              queue.
            </Card.Content>
          {:else}
            <ScrollArea class="max-h-[60vh]">
              <Table.Root>
                <Table.Header>
                  <Table.Row>
                    <Table.Head>ID</Table.Head>
                    <Table.Head>Name</Table.Head>
                    <Table.Head class="text-right">Attempts</Table.Head>
                    <Table.Head>Time</Table.Head>
                    <Table.Head class="text-right">Actions</Table.Head>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {#each data.jobs.edges as edge (edge.node.id)}
                    {@const job = edge.node}
                    <Table.Row>
                      <Table.Cell class="font-mono text-xs">{job.id}</Table.Cell>
                      <Table.Cell>
                        <div class="flex flex-col">
                          <span>{job.name}</span>
                          {#if job.failedReason}
                            <span
                              class="truncate text-xs text-destructive"
                              title={job.failedReason}
                            >
                              {job.failedReason}
                            </span>
                          {/if}
                        </div>
                      </Table.Cell>
                      <Table.Cell class="text-right font-mono">
                        {job.attemptsMade}
                      </Table.Cell>
                      <Table.Cell class="text-xs text-muted-foreground">
                        {formatTime(bestTimestamp(job))}
                      </Table.Cell>
                      <Table.Cell class="text-right">
                        {#if data.selectedStatus === "failed"}
                          <div class="flex justify-end gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={actionPending === job.id}
                              onclick={() => retryJob(job)}
                            >
                              <RefreshCw class="mr-1 size-3.5" />
                              Retry
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              disabled={actionPending === job.id}
                              onclick={() => removeJob(job)}
                            >
                              <Trash2 class="mr-1 size-3.5" />
                              Remove
                            </Button>
                          </div>
                        {:else}
                          <span class="text-xs text-muted-foreground">—</span>
                        {/if}
                      </Table.Cell>
                    </Table.Row>
                  {/each}
                </Table.Body>
              </Table.Root>
            </ScrollArea>
            <Card.Footer class="justify-between text-xs text-muted-foreground">
              <span>
                Showing {data.jobs.edges.length} of {data.jobs.total}
              </span>
            </Card.Footer>
          {/if}
        </Card.Root>
      </section>
    {/if}
  {/if}
</div>
