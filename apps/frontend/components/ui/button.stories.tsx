import { preview } from "@/.storybook/preview";
import { Button } from "@/components/ui/button";

import { LoaderCircle, Mail } from "lucide-react";

/**
 * Displays a button or a component that looks like a button.
 */
const meta = preview.meta({
  title: "ui/Button",
  component: Button,
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: [
        "default",
        "destructive",
        "outline",
        "secondary",
        "ghost",
        "link",
      ],
    },
    size: {
      control: "select",
      options: ["default", "sm", "lg", "icon"],
      if: { arg: "variant", neq: "link" },
    },
    children: {
      control: "text",
    },
    disabled: {
      control: "boolean",
    },
    asChild: {
      table: {
        disable: true,
      },
    },
  },
  parameters: {
    layout: "centered",
  },
  args: {
    variant: "default",
    size: "default",
    children: "Button",
    disabled: false,
  },
});

/**
 * The default form of the button, used for primary actions and commands.
 */
export const Default = meta.story({});

/**
 * Use the `outline` button to reduce emphasis on secondary actions, such as
 * canceling or dismissing a dialog.
 */
export const Outline = meta.story({
  args: {
    variant: "outline",
  },
});

/**
 * Use the `ghost` button is minimalistic and subtle, for less intrusive
 * actions.
 */
export const Ghost = meta.story({
  args: {
    variant: "ghost",
  },
});

/**
 * Use the `secondary` button to call for less emphasized actions, styled to
 * complement the primary button while being less conspicuous.
 */
export const Secondary = meta.story({
  args: {
    variant: "secondary",
  },
});

/**
 * Use the `destructive` button to indicate errors, alerts, or the need for
 * immediate attention.
 */
export const Destructive = meta.story({
  args: {
    variant: "destructive",
  },
});

/**
 * Use the `link` button to reduce emphasis on tertiary actions, such as
 * hyperlink or navigation, providing a text-only interactive element.
 */
export const Link = meta.story({
  args: {
    variant: "link",
  },
});

/**
 * Add the `disabled` prop to a button to prevent interactions and add a
 * loading indicator, such as a spinner, to signify an in-progress action.
 */
export const Loading = meta.story({
  render: (args) => (
    <Button {...args}>
      <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
      Button
    </Button>
  ),
  args: {
    ...Outline.composed.args,
    disabled: true,
  },
});

/**
 * Add an icon element to a button to enhance visual communication and
 * providing additional context for the action.
 */
export const WithIcon = meta.story({
  render: (args) => (
    <Button {...args}>
      <Mail className="mr-2 h-4 w-4" /> Login with Email Button
    </Button>
  ),
  args: {
    ...Secondary.composed.args,
  },
});

/**
 * Use the `sm` size for a smaller button, suitable for interfaces needing
 * compact elements without sacrificing usability.
 */
export const Small = meta.story({
  args: {
    size: "sm",
  },
});

/**
 * Use the `lg` size for a larger button, offering better visibility and
 * easier interaction for users.
 */
export const Large = meta.story({
  args: {
    size: "lg",
  },
});

/**
 * Use the "icon" size for a button with only an icon.
 */
export const Icon = meta.story({
  args: {
    ...Secondary.composed.args,
    size: "icon",
    title: "Mail",
    children: <Mail />,
  },
});

/**
 * Use the `icon-sm` size for a smaller icon-only button.
 */
export const IconSmall = meta.story({
  args: {
    variant: "secondary",
    size: "icon-sm",
    title: "Mail",
    children: <Mail />,
  },
});

/**
 * Use the `icon-lg` size for a larger icon-only button.
 */
export const IconLarge = meta.story({
  args: {
    variant: "secondary",
    size: "icon-lg",
    title: "Mail",
    children: <Mail />,
  },
});

/**
 * Add the `disabled` prop to prevent interactions with the button.
 */
export const Disabled = meta.story({
  args: {
    disabled: true,
  },
});
