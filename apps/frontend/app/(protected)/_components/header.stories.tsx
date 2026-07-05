import { Header } from "./header";

import type { Meta, StoryObj } from "@storybook/nextjs-vite";

const meta: Meta<typeof Header> = {
  title: "Components / Media / Header",
  component: Header,
  args: {
    modifierKey: "⌃",
  },
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;

type Story = StoryObj<typeof Header>;

export const Default: Story = {};
