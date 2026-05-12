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

<tbody
  bind:this={ref}
  data-slot="table-body"
  class={cn("[&_tr:last-child]:border-0", className)}
  {...restProps}
>
  {@render children?.()}
</tbody>
