<script lang="ts">
  import { Badge } from "$lib/components/ui/badge";
  import { Button } from "$lib/components/ui/button";
  import * as Card from "$lib/components/ui/card";
  import { ScrollArea } from "$lib/components/ui/scroll-area";
  import {
    AlertTriangle,
    ChevronDown,
    ChevronRight,
    CircleAlert,
    CircleCheck,
    CircleDashed,
    Puzzle,
    XCircle,
  } from "lucide-svelte";
  import type { Plugin, PluginStatus } from "./+page";

  const { data } = $props<{
    data: {
      plugins: Plugin[];
      resolverMissing: boolean;
      errorMessage: string | null;
    };
  }>();

  let expanded = $state<Record<string, boolean>>({});

  function toggle(name: string) {
    expanded[name] = !expanded[name];
  }

  function statusBadgeVariant(
    status: PluginStatus,
  ): "default" | "secondary" | "destructive" | "outline" {
    const s = status?.toLowerCase?.() ?? "";
    if (s === "healthy" || s === "ok" || s === "running") return "default";
    if (s === "degraded" || s === "warning") return "secondary";
    if (s === "error" || s === "failed" || s === "stopped") return "destructive";
    return "outline";
  }

  function statusIcon(status: PluginStatus) {
    const s = status?.toLowerCase?.() ?? "";
    if (s === "healthy" || s === "ok" || s === "running") return CircleCheck;
    if (s === "degraded" || s === "warning") return CircleAlert;
    if (s === "error" || s === "failed" || s === "stopped") return XCircle;
    return CircleDashed;
  }

  function formatTime(ts: number | null | undefined): string {
    if (!ts) return "—";
    try {
      return new Date(ts).toLocaleString();
    } catch {
      return String(ts);
    }
  }

  function settingsPreview(settings: Record<string, unknown> | null): string {
    if (!settings) return "No configuration exposed.";
    try {
      return JSON.stringify(settings, null, 2);
    } catch {
      return String(settings);
    }
  }
</script>

<div class="space-y-6 p-6">
  <header>
    <h1 class="text-2xl font-semibold tracking-tight">Plugins</h1>
    <p class="text-sm text-muted-foreground">
      Plugin health, capabilities, and read-only configuration.
    </p>
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
          GraphQL surface doesn't yet expose plugin health. The dashboard query
          (<code>plugins</code>) is ready to wire up once the upstream resolver
          lands.
        </Card.Description>
      </Card.Header>
      <Card.Content>
        <details class="text-sm text-muted-foreground">
          <summary class="cursor-pointer select-none">Server error detail</summary>
          <pre
            class="mt-2 max-h-48 overflow-auto rounded-md bg-muted p-3 text-xs">{data.errorMessage}</pre>
        </details>
      </Card.Content>
    </Card.Root>
  {:else if data.errorMessage}
    <Card.Root>
      <Card.Header>
        <Card.Title class="flex items-center gap-2">
          <XCircle class="size-5 text-destructive" />
          Couldn't load plugins
        </Card.Title>
        <Card.Description>{data.errorMessage}</Card.Description>
      </Card.Header>
    </Card.Root>
  {:else if data.plugins.length === 0}
    <Card.Root>
      <Card.Header>
        <Card.Title class="flex items-center gap-2">
          <Puzzle class="size-5" />
          No plugins registered
        </Card.Title>
        <Card.Description>
          Once a plugin registers it will appear here with health and config.
        </Card.Description>
      </Card.Header>
    </Card.Root>
  {:else}
    <section class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {#each data.plugins as plugin (plugin.name)}
        {@const Icon = statusIcon(plugin.status)}
        {@const isOpen = expanded[plugin.name] ?? false}
        <Card.Root>
          <Card.Header>
            <div class="flex items-start justify-between gap-2">
              <div class="min-w-0">
                <Card.Title class="flex items-center gap-2 truncate">
                  <Puzzle class="size-4 shrink-0 text-muted-foreground" />
                  <span class="truncate">{plugin.name}</span>
                </Card.Title>
                <Card.Description class="font-mono text-xs">
                  v{plugin.version}
                </Card.Description>
              </div>
              <Badge variant={statusBadgeVariant(plugin.status)}>
                <Icon class="mr-1 size-3.5" />
                {plugin.status}
              </Badge>
            </div>
          </Card.Header>
          <Card.Content class="space-y-3">
            {#if plugin.lastError}
              <div
                class="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-xs"
              >
                <div class="font-medium text-destructive">Last error</div>
                <div class="mt-1 break-words text-destructive">
                  {plugin.lastError.message}
                </div>
                <div class="mt-1 text-muted-foreground">
                  {formatTime(plugin.lastError.timestamp)}
                </div>
              </div>
            {/if}

            {#if plugin.capabilities && plugin.capabilities.length > 0}
              <div>
                <div class="mb-1.5 text-xs font-medium text-muted-foreground">
                  Capabilities
                </div>
                <div class="flex flex-wrap gap-1">
                  {#each plugin.capabilities as cap (cap)}
                    <Badge variant="outline" class="text-xs">{cap}</Badge>
                  {/each}
                </div>
              </div>
            {/if}

            {#if isOpen}
              <div>
                <div class="mb-1.5 text-xs font-medium text-muted-foreground">
                  Settings (read-only)
                </div>
                <ScrollArea class="max-h-64 rounded-md border bg-muted">
                  <pre class="p-3 text-xs leading-relaxed">{settingsPreview(
                      plugin.settings,
                    )}</pre>
                </ScrollArea>
              </div>
            {/if}
          </Card.Content>
          <Card.Footer>
            <Button
              variant="ghost"
              size="sm"
              class="w-full justify-start"
              onclick={() => toggle(plugin.name)}
            >
              {#if isOpen}
                <ChevronDown class="mr-1.5 size-4" />
                Hide configuration
              {:else}
                <ChevronRight class="mr-1.5 size-4" />
                View configuration
              {/if}
            </Button>
          </Card.Footer>
        </Card.Root>
      {/each}
    </section>
  {/if}
</div>
