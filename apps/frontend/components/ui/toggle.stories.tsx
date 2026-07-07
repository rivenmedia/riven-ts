import { Bold, Italic } from "lucide-react";

import { preview } from "@/.storybook/preview";
import { Toggle } from "@/components/ui/toggle";

/**
 * A two-state button that can be either on or off.
 */
const meta = preview.meta({
  title: "ui/Toggle",
  component: Toggle,
  tags: ["autodocs"],
  argTypes: {
    children: {
      control: { disable: true },
    },
  },
  args: {
    children: <Bold className="h-4 w-4" />,
    "aria-label": "Toggle bold",
  },
  parameters: {
    layout: "centered",
  },
});

/**
 * The default form of the toggle.
 */
export const Default = meta.story({});

/**
 * Use the `outline` variant for a distinct outline, emphasizing the boundary
 * of the selection circle for clearer visibility
 */
export const Outline = meta.story({
  args: {
    variant: "outline",
    children: <Italic className="h-4 w-4" />,
    "aria-label": "Toggle italic",
  },
});

/**
 * Use the text element to add a label to the toggle.
 */
export const WithText = meta.story({
  render: (args) => (
    <Toggle {...args}>
      <Italic className="mr-2 h-4 w-4" />
      Italic
    </Toggle>
  ),
  args: { ...Outline.composed.args },
});

/**
 * Use the `sm` size for a smaller toggle, suitable for interfaces needing
 * compact elements without sacrificing usability.
 */
export const Small = meta.story({
  args: {
    size: "sm",
  },
});

/**
 * Use the `lg` size for a larger toggle, offering better visibility and
 * easier interaction for users.
 */
export const Large = meta.story({
  args: {
    size: "lg",
  },
});

/**
 * Add the `disabled` prop to prevent interactions with the toggle.
 */
export const Disabled = meta.story({
  args: {
    disabled: true,
  },
});
