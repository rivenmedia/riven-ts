<script lang="ts">
  import type { HTMLTdAttributes } from "svelte/elements";
  import { cn } from "$lib/utils";

  let {
    ref = $bindable(null),
    class: className,
    children,
    ...restProps
  }: HTMLTdAttributes & { ref?: HTMLTableCellElement | null } = $props();
</script>

<td
  bind:this={ref}
  data-slot="table-cell"
  class={cn(
    "whitespace-nowrap p-2 align-middle [&:has([role=checkbox])]:pr-0",
    className,
  )}
  {...restProps}
>
  {@render children?.()}
</td>
