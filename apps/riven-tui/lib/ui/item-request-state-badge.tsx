import { Text } from "ink";

import type { ItemRequestState } from "../types/__generated__/graphql.ts";

const STATE_LABELS = {
  completed: "Completed",
  failed: "Failed",
  paused: "Paused",
  unreleased: "Unreleased",
  ongoing: "Ongoing",
  processing: "Processing",
  requested: "Requested",
} as const satisfies Record<ItemRequestState, string>;

const STATE_COLORS = {
  completed: "green",
  ongoing: "cyan",
  failed: "red",
  paused: "gray",
  processing: "blue",
  requested: "magenta",
  unreleased: "magenta",
} as const satisfies Record<ItemRequestState, string>;

export interface ItemRequestStateBadgeProps {
  state: ItemRequestState;
}

function stateLabel(state: ItemRequestState): string {
  return STATE_LABELS[state];
}

function stateColor(state: ItemRequestState): string {
  return STATE_COLORS[state];
}

export function ItemRequestStateBadge({ state }: ItemRequestStateBadgeProps) {
  return (
    <Text bold color={stateColor(state)}>
      {stateLabel(state)}
    </Text>
  );
}
