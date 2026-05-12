<script lang="ts">
  import type { HTMLAttributes } from "svelte/elements";
  import { cn } from "$lib/utils";

  let {
    ref = $bindable(null),
    class: className,
    children,
    ...restProps
  }: HTMLAttributes<HTMLElement> & { ref?: HTMLTableCaptionElement | null } = $props();
</script>

<caption
  bind:this={ref}
  data-slot="table-caption"
  class={cn("mt-4 text-sm text-muted-foreground", className)}
  {...restProps}
>
  {@render children?.()}
</caption>
