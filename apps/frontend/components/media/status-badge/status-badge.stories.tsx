import { preview } from "@/.storybook/preview";
import { MediaItemState } from "@repo/util-plugin-sdk/dto/enums/media-item-state.enum";

import { SectionHeading } from "../section-heading/section-heading";
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
  render() {
    return (
      <div className="space-y-8">
        <div>
          <SectionHeading title="Large Status Badges" />
          <div className="flex flex-wrap gap-2">
            {MediaItemState.options.map((state) => (
              <StatusBadge key={state} state={state} large />
            ))}
          </div>
        </div>
        <div>
          <SectionHeading title="Small Status Badges" />
          <div className="flex flex-wrap gap-2">
            {MediaItemState.options.map((state) => (
              <StatusBadge key={state} state={state} large={false} />
            ))}
          </div>
        </div>
      </div>
    );
  },
});
