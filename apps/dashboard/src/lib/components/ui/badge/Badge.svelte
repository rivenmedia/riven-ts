<script lang="ts" module>
  import { type VariantProps, tv } from "tailwind-variants";

  export const badgeVariants = tv({
    base: "inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-medium transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] [&>svg]:pointer-events-none [&>svg]:size-3",
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground [a&]:hover:bg-primary/90",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90",
        destructive:
          "border-transparent bg-destructive text-white [a&]:hover:bg-destructive/90 focus-visible:ring-destructive/30 dark:bg-destructive/70 dark:focus-visible:ring-destructive/40",
        outline: "text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  });

  export type BadgeVariant = VariantProps<typeof badgeVariants>["variant"];
</script>

<script lang="ts">
  import type { HTMLAnchorAttributes } from "svelte/elements";
  import { cn } from "$lib/utils";

  // Span-or-anchor: anchor attrs are a superset that works for our use here.
  type Props = HTMLAnchorAttributes & {
    variant?: BadgeVariant;
    ref?: HTMLElement | null;
  };

  let {
    ref = $bindable(null),
    href,
    class: className,
    variant = "default",
    children,
    ...restProps
  }: Props = $props();
</script>

<svelte:element
  this={href ? "a" : "span"}
  bind:this={ref}
  data-slot="badge"
  {href}
  class={cn(badgeVariants({ variant }), className)}
  {...restProps}
>
  {@render children?.()}
</svelte:element>
