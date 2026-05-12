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
  data-slot="card"
  class={cn(
    "bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6 shadow-sm",
    className,
  )}
  {...restProps}
>
  {@render children?.()}
</div>
