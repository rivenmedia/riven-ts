import { Text } from "ink";

import type { MediaItemState } from "../types/__generated__/graphql.ts";

const STATE_LABELS: Record<MediaItemState, string> = {
  completed: "Completed",
  downloaded: "Downloaded",
  failed: "Failed",
  indexed: "Indexed",
  partially_completed: "Partially completed",
  paused: "Paused",
  scraped: "Scraped",
  unreleased: "Unreleased",
};

const STATE_COLORS: Record<MediaItemState, string> = {
  completed: "green",
  downloaded: "cyan",
  failed: "red",
  indexed: "gray",
  partially_completed: "yellow",
  paused: "gray",
  scraped: "blue",
  unreleased: "magenta",
};

export interface StateBadgeProps {
  state: MediaItemState;
}

export function stateLabel(state: MediaItemState): string {
  return STATE_LABELS[state];
}

export function stateColor(state: MediaItemState): string {
  return STATE_COLORS[state];
}

export function StateBadge({ state }: StateBadgeProps) {
  return (
    <Text bold color={stateColor(state)}>
      {stateLabel(state)}
    </Text>
  );
}
