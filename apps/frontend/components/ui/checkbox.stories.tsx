import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

import { expect, userEvent, within } from "storybook/test";

import type { Meta, StoryObj } from "@storybook/nextjs-vite";

/**
 * A control that allows the user to toggle between checked and not checked.
 */
const meta: Meta<typeof Checkbox> = {
  title: "ui/Checkbox",
  component: Checkbox,
  tags: ["autodocs"],
  argTypes: {},
  args: {
    id: "terms",
    disabled: false,
  },
  render: (args) => (
    <div className="flex space-x-2">
      <Checkbox {...args} />
      <Label htmlFor={args.id}>Accept terms and conditions</Label>
    </div>
  ),
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof Checkbox>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * The default form of the checkbox.
 */
export const Default: Story = {};

/**
 * Use the `disabled` prop to disable the checkbox.
 */
export const Disabled: Story = {
  args: {
    id: "disabled-terms",
    disabled: true,
  },
};

export const ShouldToggleCheck: Story = {
  name: "when the checkbox is clicked, should toggle between checked and not checked",
  tags: ["!dev", "!autodocs"],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const checkbox = canvas.getByRole("checkbox");

    await userEvent.click(checkbox);
    await expect(checkbox).toBeChecked();

    await userEvent.click(checkbox, { delay: 100 });
    await expect(checkbox).not.toBeChecked();

    await userEvent.click(checkbox, { delay: 100 });
    await expect(checkbox).toBeChecked();
  },
};
