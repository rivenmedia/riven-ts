<script lang="ts">
  import type { HTMLInputAttributes } from "svelte/elements";
  import { cn } from "$lib/utils";

  let {
    ref = $bindable(null),
    value = $bindable(),
    class: className,
    ...restProps
  }: Omit<HTMLInputAttributes, "value"> & {
    ref?: HTMLInputElement | null;
    value?: HTMLInputAttributes["value"];
  } = $props();
</script>

<input
  bind:this={ref}
  bind:value
  data-slot="input"
  class={cn(
    "flex h-9 w-full min-w-0 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs outline-none transition-[color,box-shadow]",
    "placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground",
    "focus-visible:border-ring focus-visible:ring-ring/40 focus-visible:ring-[3px]",
    "disabled:cursor-not-allowed disabled:opacity-50",
    "aria-invalid:border-destructive aria-invalid:ring-destructive/30",
    "dark:bg-input/30",
    className,
  )}
  aria-disabled={restProps.disabled}
  {...restProps}
/>
