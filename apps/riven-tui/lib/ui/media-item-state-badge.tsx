import { Text } from "ink";

import type { MediaItemState } from "../types/__generated__/graphql.ts";

const STATE_LABELS = {
  completed: "Completed",
  downloaded: "Downloaded",
  failed: "Failed",
  indexed: "Indexed",
  partially_completed: "Partially completed",
  paused: "Paused",
  scraped: "Scraped",
  unreleased: "Unreleased",
} as const satisfies Record<MediaItemState, string>;

const STATE_COLORS = {
  completed: "green",
  downloaded: "cyan",
  failed: "red",
  indexed: "gray",
  partially_completed: "yellow",
  paused: "gray",
  scraped: "blue",
  unreleased: "magenta",
} as const satisfies Record<MediaItemState, string>;

export interface MediaItemStateBadgeProps {
  state: MediaItemState;
}

function stateLabel(state: MediaItemState): string {
  return STATE_LABELS[state];
}

function stateColor(state: MediaItemState): string {
  return STATE_COLORS[state];
}

export function MediaItemStateBadge({ state }: MediaItemStateBadgeProps) {
  return (
    <Text bold color={stateColor(state)}>
      {stateLabel(state)}
    </Text>
  );
}
