<script lang="ts">
  import "../app.css";
  import Sidebar from "$lib/components/layout/sidebar.svelte";
  import Topbar from "$lib/components/layout/topbar.svelte";

  let { children } = $props();
</script>

<div class="flex min-h-screen w-full bg-background text-foreground">
  <Sidebar />
  <div class="flex min-w-0 flex-1 flex-col">
    <Topbar />
    <main class="flex-1 overflow-y-auto p-6">
      {@render children?.()}
    </main>
  </div>
</div>
