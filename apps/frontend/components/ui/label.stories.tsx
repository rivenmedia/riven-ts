import { preview } from "@/.storybook/preview";
import { Label } from "@/components/ui/label";

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
