import { preview } from "@/.storybook/preview";

import { ListChecks, LoaderCircle, Trash } from "lucide-react";
import { startTransition, useState } from "react";
import { fn } from "storybook/test";

import { Button } from "../_ui/button";
import { SelectionActionBar } from "./selection-action-bar";

const meta = preview.meta({
  title: "Components / SelectionActionBar",
  component: SelectionActionBar,
  parameters: {
    layout: "fullscreen",
  },
  args: {
    actions: [
      { label: "Reset", icon: ListChecks, handleClick: fn() },
      { label: "Retry", icon: LoaderCircle, handleClick: fn() },
      {
        label: "Remove",
        icon: Trash,
        variant: "destructive",
        handleClick: fn(),
      },
    ],
    onClear: fn(),
  },
  render: (args) => {
    const [count, setCount] = useState(args.count);

    return (
      <div className="relative h-40 w-full">
        <Button
          onClick={() => {
            startTransition(() => {
              setCount(count === 0 ? 5 : 0);
            });
          }}
        >
          Toggle
        </Button>
        {count > 0 && <SelectionActionBar {...args} count={count} />}
      </div>
    );
  },
});

export const Default = meta.story({
  args: {
    count: 5,
  },
});

export const Loading = meta.story({
  args: {
    count: 5,
    disabled: true,
  },
});

export const Hidden = meta.story({
  args: {
    count: 0,
  },
});
