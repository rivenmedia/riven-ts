<script lang="ts">
  import type { HTMLTableAttributes } from "svelte/elements";
  import { cn } from "$lib/utils";

  let {
    ref = $bindable(null),
    class: className,
    children,
    ...restProps
  }: HTMLTableAttributes & { ref?: HTMLTableElement | null } = $props();
</script>

<div data-slot="table-container" class="relative w-full overflow-x-auto">
  <table
    bind:this={ref}
    data-slot="table"
    class={cn("w-full caption-bottom text-sm", className)}
    {...restProps}
  >
    {@render children?.()}
  </table>
</div>
