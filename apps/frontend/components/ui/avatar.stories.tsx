import { preview } from "@/.storybook/preview";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

/**
 * An image element with a fallback for representing the user.
 */
const meta = preview.meta({
  title: "ui/Avatar",
  component: Avatar,
  tags: ["autodocs"],
  argTypes: {},
  render: (args) => (
    <Avatar {...args}>
      <AvatarImage src="https://github.com/shadcn.png" />
      <AvatarFallback>CN</AvatarFallback>
    </Avatar>
  ),
  parameters: {
    layout: "centered",
  },
});

/**
 * The default form of the avatar.
 */
export const Default = meta.story({});
