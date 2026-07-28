import { preview } from "@/.storybook/preview";
import { Badge } from "@/components/ui/badge";

/**
 * Displays a badge or a component that looks like a badge.
 */
const meta = preview.meta({
  title: "ui/Badge",
  component: Badge,
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "secondary", "destructive", "outline"],
    },
    children: {
      control: "text",
      description: "Badge content",
    },
  },
  args: {
    variant: "default",
    children: "Badge",
  },
  parameters: {
    layout: "centered",
  },
});

/**
 * The default form of the badge.
 */
export const Default = meta.story({});

/**
 * Use the `secondary` badge to call for less urgent information, blending
 * into the interface while still signaling minor updates or statuses.
 */
export const Secondary = meta.story({
  args: {
    variant: "secondary",
  },
});

/**
 * Use the `destructive` badge to  indicate errors, alerts, or the need for
 * immediate attention.
 */
export const Destructive = meta.story({
  args: {
    variant: "destructive",
  },
});

/**
 * Use the `outline` badge for overlaying without obscuring interface details,
 * emphasizing clarity and subtlety..
 */
export const Outline = meta.story({
  args: {
    variant: "outline",
  },
});
