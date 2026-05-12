<script lang="ts">
  import type { HTMLAttributes } from "svelte/elements";
  import { cn } from "$lib/utils";

  let {
    ref = $bindable(null),
    class: className,
    children,
    ...restProps
  }: HTMLAttributes<HTMLTableSectionElement> & {
    ref?: HTMLTableSectionElement | null;
  } = $props();
</script>

<thead
  bind:this={ref}
  data-slot="table-header"
  class={cn("[&_tr]:border-b", className)}
  {...restProps}
>
  {@render children?.()}
</thead>
