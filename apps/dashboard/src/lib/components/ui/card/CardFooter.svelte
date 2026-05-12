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
  data-slot="card-footer"
  class={cn("flex items-center px-6 [.border-t]:pt-6", className)}
  {...restProps}
>
  {@render children?.()}
</div>
