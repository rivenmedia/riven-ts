<script lang="ts">
  import type { HTMLAttributes } from "svelte/elements";
  import { cn } from "$lib/utils";

  let {
    ref = $bindable(null),
    class: className,
    children,
    ...restProps
  }: HTMLAttributes<HTMLTableRowElement> & { ref?: HTMLTableRowElement | null } = $props();
</script>

<tr
  bind:this={ref}
  data-slot="table-row"
  class={cn(
    "border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",
    className,
  )}
  {...restProps}
>
  {@render children?.()}
</tr>
