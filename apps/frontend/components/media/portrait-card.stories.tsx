import { preview } from "@/.storybook/preview";

import { fn } from "storybook/test";

import { PortraitCard } from "./portrait-card";

const meta = preview.meta({
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
});

export const Default = meta.story({
  args: {
    image: null,
  },
});

export const WithImage = meta.story({
  args: {
    image: "https://picsum.photos/200/300",
  },
});

export const Selected = meta.story({
  args: {
    image: null,
    isSelectable: true,
    isSelected: true,
  },
});
