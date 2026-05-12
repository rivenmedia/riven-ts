<script lang="ts" module>
  import { tv, type VariantProps } from "tailwind-variants";

  export const sheetVariants = tv({
    base: "fixed z-50 flex flex-col gap-4 bg-background shadow-lg transition ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:duration-300 data-[state=open]:duration-500",
    variants: {
      side: {
        top: "inset-x-0 top-0 h-auto border-b data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top",
        bottom:
          "inset-x-0 bottom-0 h-auto border-t data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
        left: "inset-y-0 left-0 h-full w-3/4 border-r data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left sm:max-w-sm",
        right:
          "inset-y-0 right-0 h-full w-3/4 border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right sm:max-w-sm",
      },
    },
    defaultVariants: {
      side: "right",
    },
  });

  export type SheetSide = VariantProps<typeof sheetVariants>["side"];
</script>

<script lang="ts">
  import { Dialog as SheetPrimitive } from "bits-ui";
  import XIcon from "lucide-svelte/icons/x";
  import { cn } from "$lib/utils";

  let {
    ref = $bindable(null),
    class: className,
    side = "right" as SheetSide,
    portalProps,
    children,
    ...restProps
  }: SheetPrimitive.ContentProps & {
    portalProps?: SheetPrimitive.PortalProps;
    side?: SheetSide;
  } = $props();
</script>

<SheetPrimitive.Portal {...portalProps}>
  <SheetPrimitive.Overlay
    data-slot="sheet-overlay"
    class="fixed inset-0 z-50 bg-black/50 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0"
  />
  <SheetPrimitive.Content
    bind:ref
    data-slot="sheet-content"
    class={cn(sheetVariants({ side }), className)}
    {...restProps}
  >
    {@render children?.()}
    <SheetPrimitive.Close
      class="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none"
    >
      <XIcon class="size-4" />
      <span class="sr-only">Close</span>
    </SheetPrimitive.Close>
  </SheetPrimitive.Content>
</SheetPrimitive.Portal>
