import { expect, userEvent, within } from "storybook/test";

import preview from "@/.storybook/preview";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

/**
 * A control that allows the user to toggle between checked and not checked.
 */
const meta = preview.meta({
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
});

/**
 * The default form of the checkbox.
 */
export const Default = meta.story({});

/**
 * Use the `disabled` prop to disable the checkbox.
 */
export const Disabled = meta.story({
  args: {
    id: "disabled-terms",
    disabled: true,
  },
});

Default.test(
  "When the checkbox is clicked, it toggles between checked and unchecked",
  async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const checkbox = canvas.getByRole("checkbox");

    await userEvent.click(checkbox);
    await expect(checkbox).toBeChecked();

    await userEvent.click(checkbox, { delay: 100 });
    await expect(checkbox).not.toBeChecked();

    await userEvent.click(checkbox, { delay: 100 });
    await expect(checkbox).toBeChecked();
  },
);
