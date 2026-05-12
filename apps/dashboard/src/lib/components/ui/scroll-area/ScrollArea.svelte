<script lang="ts">
  import { ScrollArea as ScrollAreaPrimitive } from "bits-ui";
  import { cn } from "$lib/utils";

  type Orientation = "vertical" | "horizontal" | "both";

  let {
    ref = $bindable(null),
    class: className,
    orientation = "vertical" as Orientation,
    scrollbarXClasses = "",
    scrollbarYClasses = "",
    children,
    ...restProps
  }: ScrollAreaPrimitive.RootProps & {
    orientation?: Orientation;
    scrollbarXClasses?: string;
    scrollbarYClasses?: string;
  } = $props();
</script>

<ScrollAreaPrimitive.Root
  bind:ref
  data-slot="scroll-area"
  class={cn("relative", className)}
  {...restProps}
>
  <ScrollAreaPrimitive.Viewport
    data-slot="scroll-area-viewport"
    class="size-full rounded-[inherit] outline-none transition-[color,box-shadow] focus-visible:ring-4 focus-visible:ring-ring/20"
  >
    {@render children?.()}
  </ScrollAreaPrimitive.Viewport>
  {#if orientation === "vertical" || orientation === "both"}
    <ScrollAreaPrimitive.Scrollbar
      orientation="vertical"
      class={cn(
        "flex h-full w-2.5 touch-none select-none border-l border-l-transparent p-px transition-colors",
        scrollbarYClasses,
      )}
    >
      <ScrollAreaPrimitive.Thumb class="relative flex-1 rounded-full bg-border" />
    </ScrollAreaPrimitive.Scrollbar>
  {/if}
  {#if orientation === "horizontal" || orientation === "both"}
    <ScrollAreaPrimitive.Scrollbar
      orientation="horizontal"
      class={cn(
        "flex h-2.5 flex-col touch-none select-none border-t border-t-transparent p-px transition-colors",
        scrollbarXClasses,
      )}
    >
      <ScrollAreaPrimitive.Thumb class="relative flex-1 rounded-full bg-border" />
    </ScrollAreaPrimitive.Scrollbar>
  {/if}
  <ScrollAreaPrimitive.Corner />
</ScrollAreaPrimitive.Root>
