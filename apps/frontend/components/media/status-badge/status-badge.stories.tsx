import { preview } from "@/.storybook/preview";
import { MediaItemState } from "@repo/util-plugin-sdk/dto/enums/media-item-state.enum";

import { StatusBadge } from "./status-badge";

const meta = preview.meta({
  title: "Media / StatusBadge",
  component: StatusBadge,
  argTypes: {
    state: {
      control: "select",
      options: [
        "completed",
        "partially_completed",
        "ongoing",
        "scraped",
        "indexed",
        "unreleased",
        "paused",
        "failed",
        "requested",
      ],
    },
    large: {
      control: "boolean",
    },
  },
  args: {
    state: "completed" as const,
    large: true,
  },
});

export const Default = meta.story();

export const AllStates = meta.story({
  render({ large = false }) {
    return (
      <div className="flex flex-wrap gap-2">
        {MediaItemState.options.map((state) => (
          <StatusBadge key={state} state={state} large={large} />
        ))}
      </div>
    );
  },
});
