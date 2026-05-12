<script lang="ts">
  import type { HTMLAttributes } from "svelte/elements";
  import { cn } from "$lib/utils";

  let {
    ref = $bindable(null),
    class: className,
    children,
    ...restProps
  }: HTMLAttributes<HTMLDivElement> & { ref?: HTMLDivElement | null } = $props();
</script>

<div
  bind:this={ref}
  data-slot="sheet-header"
  class={cn("flex flex-col gap-1.5 p-4", className)}
  {...restProps}
>
  {@render children?.()}
</div>
