import { Label } from "@repo/util-ui/components/_ui/label.tsx";

import { preview } from "#.storybook/preview.tsx";

/**
 * Renders an accessible label associated with controls.
 */
const meta = preview.meta({
  title: "ui/Label",
  component: Label,
  tags: ["autodocs"],
  argTypes: {
    children: {
      control: { type: "text" },
    },
  },
  args: {
    children: "Your email address",
    htmlFor: "email",
  },
});

/**
 * The default form of the label.
 */
export const Default = meta.story({});
