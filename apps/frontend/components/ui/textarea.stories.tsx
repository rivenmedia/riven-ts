import { preview } from "@/.storybook/preview";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

/**
 * Displays a form textarea or a component that looks like a textarea.
 */
const meta = preview.meta({
  title: "ui/Textarea",
  component: Textarea,
  tags: ["autodocs"],
  argTypes: {},
  args: {
    placeholder: "Type your message here.",
    disabled: false,
  },
});

/**
 * The default form of the textarea.
 */
export const Default = meta.story({});

/**
 * Use the `disabled` prop to disable the textarea.
 */
export const Disabled = meta.story({
  args: {
    disabled: true,
  },
});

/**
 * Use the `Label` component to includes a clear, descriptive label above or
 * alongside the text area to guide users.
 */
export const WithLabel = meta.story({
  render: (args) => (
    <div className="grid w-full gap-1.5">
      <Label htmlFor="message">Your message</Label>
      <Textarea {...args} id="message" />
    </div>
  ),
});

/**
 * Use a text element below the text area to provide additional instructions
 * or information to users.
 */
export const WithText = meta.story({
  render: (args) => (
    <div className="grid w-full gap-1.5">
      <Label htmlFor="message-2">Your Message</Label>
      <Textarea {...args} id="message-2" />
      <p className="text-slate-500 text-sm">
        Your message will be copied to the support team.
      </p>
    </div>
  ),
});

/**
 * Use the `Button` component to indicate that the text area can be submitted
 * or used to trigger an action.
 */
export const WithButton = meta.story({
  render: (args) => (
    <div className="grid w-full gap-2">
      <Textarea {...args} />
      <Button type="submit">Send Message</Button>
    </div>
  ),
});
