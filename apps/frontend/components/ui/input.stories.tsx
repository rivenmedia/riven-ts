import preview from "@/.storybook/preview";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { expect, userEvent } from "storybook/test";

/**
 * Displays a form input field or a component that looks like an input field.
 */
const meta = preview.meta({
  title: "ui/Input",
  component: Input,
  tags: ["autodocs"],
  argTypes: {},
  args: {
    className: "w-96",
    type: "email",
    placeholder: "Email",
    disabled: false,
  },
  parameters: {
    layout: "centered",
  },
});

/**
 * The default form of the input field.
 */
export const Default = meta.story({});

/**
 * Use the `disabled` prop to make the input non-interactive and appears faded,
 * indicating that input is not currently accepted.
 */
export const Disabled = meta.story({
  args: { disabled: true },
});

/**
 * Use the `Label` component to includes a clear, descriptive label above or
 * alongside the input area to guide users.
 */
export const WithLabel = meta.story({
  render: (args) => (
    <div className="grid items-center gap-1.5">
      <Label htmlFor="email">{args.placeholder}</Label>
      <Input {...args} id="email" />
    </div>
  ),
});

/**
 * Use a text element below the input field to provide additional instructions
 * or information to users.
 */
export const WithHelperText = meta.story({
  render: (args) => (
    <div className="grid items-center gap-1.5">
      <Label htmlFor="email-2">{args.placeholder}</Label>
      <Input {...args} id="email-2" />
      <p className="text-foreground/60 text-sm">Enter your email address.</p>
    </div>
  ),
});

/**
 * Use the `Button` component to indicate that the input field can be submitted
 * or used to trigger an action.
 */
export const WithButton = meta.story({
  render: (args) => (
    <div className="flex items-center space-x-2">
      <Input {...args} />
      <Button type="submit">Subscribe</Button>
    </div>
  ),
});

Default.test(
  "When the user enters text, it is visible in the input field",
  async ({ canvas, step }) => {
    const input = await canvas.findByPlaceholderText(/email/i);
    const mockedInput = "mocked@shadcn.com";

    await step("focus and type into the input field", async () => {
      await userEvent.click(input);
      await userEvent.type(input, mockedInput);
    });

    await expect(input).toHaveValue(mockedInput);
  },
);
