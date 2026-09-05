import { preview } from "@/.storybook/preview";

import { ListChecks, LoaderCircle, Trash } from "lucide-react";
import { fn } from "storybook/test";

import { SelectionActionBar } from "./selection-action-bar";

import type { SelectionAction } from "./selection-action-bar";

const meta = preview.meta({
  title: "Components / SelectionActionBar",
  component: SelectionActionBar,
  parameters: {
    layout: "fullscreen",
  },
  args: {
    onClear: fn(),
  },
  render: (args) => (
    <div className="relative h-40 w-full">
      <SelectionActionBar {...args} />
    </div>
  ),
});

const actions = [
  { label: "Reset", icon: ListChecks, handleClick: fn() },
  { label: "Retry", icon: LoaderCircle, handleClick: fn() },
  {
    label: "Remove",
    icon: Trash,
    variant: "destructive",
    handleClick: fn(),
  },
] as const satisfies [SelectionAction, ...SelectionAction[]];

export const Default = meta.story({
  args: {
    actions,
    count: 5,
  },
});

export const Loading = meta.story({
  args: {
    actions,
    count: 5,
    disabled: true,
  },
});
