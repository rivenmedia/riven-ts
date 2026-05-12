<script lang="ts">
  import { page } from "$app/state";
  import ThemeToggle from "./theme-toggle.svelte";

  // Title resolution: prefer page.data.title if a load function set it,
  // otherwise derive a friendly label from the first path segment.
  function deriveTitle(pathname: string): string {
    if (pathname === "/" || pathname === "") return "Overview";
    const seg = pathname.split("/").filter(Boolean)[0] ?? "";
    return seg.charAt(0).toUpperCase() + seg.slice(1);
  }

  const title = $derived(
    (page.data && (page.data as { title?: string }).title) ||
      deriveTitle(page.url.pathname),
  );
</script>

<header
  class="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background/95 px-6 backdrop-blur supports-[backdrop-filter]:bg-background/80"
>
  <div class="flex items-center gap-3">
    <h1 class="text-sm font-semibold tracking-tight">{title}</h1>
  </div>
  <div class="flex items-center gap-3">
    <span class="rounded-md border border-border bg-muted/40 px-2 py-0.5 text-[11px] font-mono text-muted-foreground">
      Riven dev
    </span>
    <ThemeToggle />
  </div>
</header>
