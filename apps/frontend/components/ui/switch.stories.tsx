import { preview } from "@/.storybook/preview";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

import { expect, userEvent } from "storybook/test";

/**
 * A control that allows the user to toggle between checked and not checked.
 */
const meta = preview.meta({
  title: "ui/Switch",
  component: Switch,
  tags: ["autodocs"],
  argTypes: {},
  parameters: {
    layout: "centered",
  },
  render: (args) => (
    <div className="flex items-center space-x-2">
      <Switch {...args} />
      <Label htmlFor={args.id}>Airplane Mode</Label>
    </div>
  ),
});

/**
 * The default form of the switch.
 */
export const Default = meta.story({
  args: {
    id: "default-switch",
  },
});

/**
 * Use the `disabled` prop to disable the switch.
 */
export const Disabled = meta.story({
  args: {
    id: "disabled-switch",
    disabled: true,
  },
});

Default.test(
  "When clicking the switch, it toggles on and off",
  async ({ canvas, step }) => {
    const switchBtn = await canvas.findByRole("switch");

    await step("toggle the switch on", async () => {
      await userEvent.click(switchBtn);
      await expect(switchBtn).toBeChecked();
    });

    await step("toggle the switch off", async () => {
      await userEvent.click(switchBtn);
      await expect(switchBtn).not.toBeChecked();
    });
  },
);
