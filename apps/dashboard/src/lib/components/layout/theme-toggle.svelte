<script lang="ts">
  import Sun from "lucide-svelte/icons/sun";
  import Moon from "lucide-svelte/icons/moon";
  import { browser } from "$app/environment";
  import { cn } from "$lib/utils";

  const STORAGE_KEY = "theme";

  // Initial value: read from <html class="dark"> at mount so SSR + client agree.
  let isDark = $state(true);

  $effect(() => {
    if (!browser) return;
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "dark" || stored === "light") {
      isDark = stored === "dark";
    } else {
      isDark = document.documentElement.classList.contains("dark");
    }
    apply(isDark);
  });

  function apply(dark: boolean) {
    if (!browser) return;
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem(STORAGE_KEY, dark ? "dark" : "light");
  }

  function toggle() {
    isDark = !isDark;
    apply(isDark);
  }
</script>

<button
  type="button"
  onclick={toggle}
  aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
  aria-pressed={isDark}
  class={cn(
    "inline-flex size-8 items-center justify-center rounded-md border border-border bg-background text-muted-foreground transition-colors",
    "hover:bg-accent hover:text-accent-foreground",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
  )}
>
  {#if isDark}
    <Sun class="size-4" />
  {:else}
    <Moon class="size-4" />
  {/if}
</button>
