import { Header } from "./header";

import type { Meta, StoryObj } from "@storybook/nextjs-vite";

const meta = {
  title: "Components / Media / Header",
  component: Header,
  args: {
    modifierKey: "⌃",
  },
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof Header>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
