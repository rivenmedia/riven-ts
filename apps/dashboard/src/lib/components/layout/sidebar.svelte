<script lang="ts">
  import { page } from "$app/state";
  import LayoutDashboard from "lucide-svelte/icons/layout-dashboard";
  import Library from "lucide-svelte/icons/library";
  import ListChecks from "lucide-svelte/icons/list-checks";
  import Plug from "lucide-svelte/icons/plug";
  import Activity from "lucide-svelte/icons/activity";
  import { cn } from "$lib/utils";

  // lucide-svelte icons are Svelte components. Keep the type loose so we
  // don't have to depend on a specific (changing) lucide type surface.
  type IconComponent = typeof LayoutDashboard;

  type NavItem = {
    href: string;
    label: string;
    icon: IconComponent;
    // Match exactly, or also match nested routes when `prefix` is true.
    prefix?: boolean;
  };

  const items: NavItem[] = [
    { href: "/", label: "Overview", icon: LayoutDashboard },
    { href: "/library", label: "Library", icon: Library, prefix: true },
    { href: "/queue", label: "Queue", icon: ListChecks, prefix: true },
    { href: "/plugins", label: "Plugins", icon: Plug, prefix: true },
  ];

  function isActive(item: NavItem, pathname: string): boolean {
    if (item.href === "/") return pathname === "/";
    if (item.prefix) return pathname === item.href || pathname.startsWith(item.href + "/");
    return pathname === item.href;
  }
</script>

<aside
  class="flex h-screen w-56 shrink-0 flex-col border-r border-border bg-card sticky top-0"
>
  <div class="flex h-14 items-center gap-2 border-b border-border px-4">
    <div
      class="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground"
    >
      <Activity class="size-4" />
    </div>
    <div class="flex flex-col leading-tight">
      <span class="text-sm font-semibold tracking-tight">Riven</span>
      <span class="text-[10px] uppercase tracking-wider text-muted-foreground">
        Dashboard
      </span>
    </div>
  </div>

  <nav class="flex-1 overflow-y-auto p-2">
    <ul class="flex flex-col gap-0.5">
      {#each items as item (item.href)}
        {@const active = isActive(item, page.url.pathname)}
        <li>
          <a
            href={item.href}
            data-active={active}
            class={cn(
              "group flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium text-muted-foreground transition-colors",
              "hover:bg-accent hover:text-accent-foreground",
              active && "bg-accent text-accent-foreground",
            )}
          >
            <item.icon class="size-4 shrink-0" />
            <span>{item.label}</span>
          </a>
        </li>
      {/each}
    </ul>
  </nav>

  <div class="border-t border-border p-3">
    <p class="text-[11px] leading-tight text-muted-foreground">
      <span class="font-mono">riven-ts</span> · admin
    </p>
  </div>
</aside>
