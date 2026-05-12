<script lang="ts">
  import type { HTMLAttributes } from "svelte/elements";
  import { cn } from "$lib/utils";

  let {
    ref = $bindable(null),
    class: className,
    ...restProps
  }: Omit<HTMLAttributes<HTMLDivElement>, "children"> & {
    ref?: HTMLDivElement | null;
  } = $props();
</script>

<div
  bind:this={ref}
  data-slot="skeleton"
  class={cn("animate-pulse rounded-md bg-muted", className)}
  {...restProps}
></div>
