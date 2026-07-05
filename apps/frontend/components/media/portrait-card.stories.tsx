import { fn } from "storybook/test";

import { PortraitCard } from "./portrait-card";

import type { Meta, StoryObj } from "@storybook/nextjs-vite";

const meta: Meta<typeof PortraitCard> = {
  title: "Components / Media / PortraitCard",
  component: PortraitCard,
  args: {
    title: "Portrait Card",
    onSelectToggle: fn(),
  },
  decorators: [
    (Story) => (
      <div className="flex h-100 w-75 items-center justify-center">
        <Story />
      </div>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof PortraitCard>;

export const Default: Story = {};

export const WithImage: Story = {
  args: {
    image: "https://picsum.photos/200/300",
  },
};

export const Selected: Story = {
  args: {
    isSelectable: true,
    isSelected: true,
  },
};
